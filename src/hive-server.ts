import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { Client, PrivateKey } from "@hiveio/dhive";
import { z } from "zod";

const client = new Client([
  "https://api.hive.blog",
  "https://api.hivekings.com",
  "https://anyx.io",
  "https://api.openhive.network"
]);

const server = new McpServer({ name: "HiveServer", version: "1.0.1" });

// Resource 1: Fetch account information
server.resource(
  "account",
  new ResourceTemplate("hive://accounts/{account}", { list: undefined }),
  // "Fetches detailed information about a Hive blockchain account including balance, authority, voting power, and other account metrics."
  async (uri, { account }) => {
    try {
      const accounts = await client.database.getAccounts(Array.isArray(account) ? account : [account]);
      if (accounts.length === 0) {
        throw new Error(`Account ${account} not found`);
      }
      const accountData = accounts[0];
      const text = JSON.stringify(accountData, null, 2);
      return { contents: [{ uri: uri.href, text }] };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Error fetching account: ${errorMessage}`);
    }
  }
);

// Resource 2: Fetch a specific post
server.resource(
  "post",
  new ResourceTemplate("hive://posts/{author}/{permlink}", { list: undefined }),
  // "Retrieves a specific Hive blog post identified by author and permlink, including the post title, content, and metadata.",
  async (uri, { author, permlink }) => {
    try {
      const content = await client.database.call("get_content", [author, permlink]);
      if (!content.author) {
        throw new Error(`Post not found: ${author}/${permlink}`);
      }
      const text = JSON.stringify({
        title: content.title,
        author: content.author,
        body: content.body
      }, null, 2);
      return { contents: [{ uri: uri.href, text, mimeType: "application/json" }] };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Error fetching post: ${errorMessage}`);
    }
  }
);

// Valid discussion query categories for tag-based queries
const tagQueryCategories = z.enum([
  'active', 'cashout', 'children', 'comments',
  'created', 'hot', 'promoted', 'trending', 'votes'
]);

// Valid discussion query categories for user-based queries
const userQueryCategories = z.enum(['blog', 'feed']);

// Tool 1: Fetch posts by tag
server.tool(
  "get_posts_by_tag",
  "Retrieves Hive posts filtered by a specific tag and sorted by a category like trending, hot, or created.",
  { 
    category: tagQueryCategories.describe("Sorting category for posts (e.g. trending, hot, created)"),
    tag: z.string().describe("The tag to filter posts by"),
    limit: z.number().min(1).max(20).default(10).describe("Number of posts to return (1-20)")
  },
  async ({ category, tag, limit }) => {
    try {
      const posts = await client.database.getDiscussions(category, { tag, limit });
      
      const formattedPosts = posts.map(post => ({
        title: post.title,
        author: post.author,
        permlink: post.permlink,
        created: post.created,
        votes: post.net_votes,
        payout: post.pending_payout_value
      }));

      return {
        content: [{ 
          type: "text" as const, 
          text: JSON.stringify(formattedPosts, null, 2), 
          mimeType: "application/json"
        }]
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        content: [{ 
          type: "text" as const, 
          text: `Error in get_posts_by_tag: ${errorMessage}`
        }],
        isError: true
      };
    }
  }
);

// Tool 2: Fetch posts by user ID
server.tool(
  "get_posts_by_user",
  "Retrieves posts authored by or in the feed of a specific Hive user.",
  { 
    category: userQueryCategories.describe("Type of user posts to fetch (blog = posts by user, feed = posts from users they follow)"),
    username: z.string().describe("Hive username to fetch posts for"),
    limit: z.number().min(1).max(20).default(10).describe("Number of posts to return (1-20)")
  },
  async ({ category, username, limit }) => {
    try {
      // For blog and feed queries, the username is provided as the tag parameter
      const posts = await client.database.getDiscussions(category, { tag: username, limit });
      
      const formattedPosts = posts.map(post => ({
        title: post.title,
        author: post.author,
        permlink: post.permlink,
        created: post.created,
        votes: post.net_votes,
        payout: post.pending_payout_value
      }));

      return {
        content: [{ 
          type: "text" as const, 
          text: JSON.stringify(formattedPosts, null, 2), 
          mimeType: "application/json"
        }]
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        content: [{ 
          type: "text" as const, 
          text: `Error in get_posts_by_user: ${errorMessage}`
        }],
        isError: true
      };
    }
  }
);

// Resource 3: Fetch account history
server.tool(
  "get_account_history",
  "Retrieves transaction history for a Hive account with optional operation type filtering.",
  { 
    username: z.string().describe("Hive username"), 
    limit: z.number().min(1).max(100).default(10).describe("Number of operations to return"),
    operation_filter: z.union([
      z.array(z.string()),
      z.string().transform((val, ctx) => {
        // Handle empty string
        if (!val.trim()) return [];
        
        try {
          // Try to parse it as JSON first in case it's a properly formatted JSON array
          if ((val.startsWith('[') && val.endsWith(']'))) {
            try {
              const parsed = JSON.parse(val);
              if (Array.isArray(parsed)) {
                return parsed;
              }
            } catch (e) {
              // Failed to parse as JSON, continue to other methods
            }
          }
          
          // Handle comma-separated list (possibly with quotes)
          return val
            .replace(/^\[|\]$/g, '') // Remove outer brackets if present
            .split(',')
            .map(item => 
              item.trim()
                .replace(/^['"]|['"]$/g, '') // Remove surrounding quotes
            )
            .filter(Boolean); // Remove empty entries
        } catch (error) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Could not parse operation_filter: ${val}. Please provide a comma-separated list or array of operation types.`,
          });
          return z.NEVER;
        }
      })
    ]).optional().describe("Operation types to filter for. Can be provided as an array ['transfer', 'vote'] or a comma-separated string 'transfer,vote'"),
  },
  async ({ username, limit, operation_filter }) => {
    try {
      // The getAccountHistory method needs a starting point (from) parameter
      // We'll use -1 to get the most recent transactions
      const from = -1;
      
      // Convert string operation types to their numerical bitmask if provided
      let operation_bitmask = undefined;
      if (operation_filter && operation_filter.length > 0) {
        // This would require mapping operation names to their numeric codes
        // For simplicity, we're skipping the bitmask transformation
      }
      
      const history = await client.database.getAccountHistory(username, from, limit, operation_bitmask);
      
      if (!history || !Array.isArray(history)) {
        return {
          content: [{ 
            type: "text", 
            text: `No history found for account: ${username}`,
            mimeType: "text/plain"
          }]
        };
      }
      
      // Format the history into a structured object
      const formattedHistory = history.map(([index, operation]) => {
        const { timestamp, op, trx_id } = operation;
        const opType = op[0];
        const opData = op[1];
        
        // Filter operations if needed
        if (operation_filter && operation_filter.length > 0 && !operation_filter.includes(opType)) {
          return null;
        }
        
        return {
          index,
          type: opType,
          timestamp,
          transaction_id: trx_id,
          details: opData
        };
      }).filter(Boolean); // Remove null entries (filtered out operations)
      
      const response = {
        content: [{ 
          type: "text" as const, 
          text: JSON.stringify({
            account: username,
            operations_count: formattedHistory.length,
            operations: formattedHistory
          }, null, 2),
          mimeType: "application/json" 
        }]
      };

      return response;
    } catch (error) {
      return {
        content: [{ 
          type: "text", 
          text: `Error retrieving account history: ${error instanceof Error ? error.message : String(error)}`,
          mimeType: "text/plain" 
        }],
        isError: true
      };
    }
  }
);

// Tool: Vote on a post
server.tool(
  "vote_on_post",
  "Vote on a Hive post (upvote or downvote) using the configured Hive account.",
  { 
    author: z.string().describe("Author of the post to vote on"),
    permlink: z.string().describe("Permlink of the post to vote on"),
    weight: z.number().min(-10000).max(10000).describe("Vote weight from -10000 (100% downvote) to 10000 (100% upvote)")
  },
  async ({ author, permlink, weight }) => {
    try {
      // Get credentials from environment variables
      const username = process.env.HIVE_USERNAME;
      const privateKey = process.env.HIVE_POSTING_KEY;
      
      if (!username || !privateKey) {
        return {
          content: [{ 
            type: "text" as const, 
            text: "Error: HIVE_USERNAME or HIVE_POSTING_KEY environment variables are not set" 
          }],
          isError: true
        };
      }

      // Create the vote operation
      const vote = {
        voter: username,
        author,
        permlink,
        weight
      };

      // Create the broadcast instance and broadcast the vote
      const result = await client.broadcast.vote(vote, PrivateKey.fromString(privateKey));
      
      return {
        content: [{ 
          type: "text" as const, 
          text: JSON.stringify({
            success: true,
            transaction_id: result.id,
            block_num: result.block_num,
            voter: username,
            author,
            permlink,
            weight
          }, null, 2), 
          mimeType: "application/json"
        }]
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        content: [{ 
          type: "text" as const, 
          text: `Error in vote_on_post: ${errorMessage}`
        }],
        isError: true
      };
    }
  }
);

// Start the server with standard MCP transport
const startServer = async () => {
    // Log environment variable status (without exposing the actual private key)
    if (!process.env.HIVE_USERNAME) {
      console.error("Warning: HIVE_USERNAME environment variable is not set");
    } else {
      console.error(`Info: Using Hive account: ${process.env.HIVE_USERNAME}`);
    }
    
    if (!process.env.HIVE_POSTING_KEY) {
      console.error("Warning: HIVE_POSTING_KEY environment variable is not set");
    } else {
      console.error("Info: HIVE_POSTING_KEY is set");
      
      // Validate private key format (without logging the actual key)
      try {
        PrivateKey.fromString(process.env.HIVE_POSTING_KEY);
        console.error("Info: HIVE_POSTING_KEY is valid");
      } catch (error) {
        console.error("Warning: HIVE_POSTING_KEY is not a valid private key");
      }
    }
  
  const transport = new StdioServerTransport();
  await server.connect(transport);
};

startServer().catch((err) => console.error("Server failed to start:", err));

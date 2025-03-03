import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { Client } from "@hiveio/dhive";
import { z } from "zod";

const client = new Client([
  "https://api.hive.blog",
  "https://api.hivekings.com",
  "https://anyx.io",
  "https://api.openhive.network"
]);

const server = new McpServer({ name: "HiveServer", version: "1.0.0" });

// Resource 1: Fetch account information
server.resource(
  "account",
  new ResourceTemplate("hive://accounts/{account}", { list: undefined }),
  async (uri, { account }) => {
    // console.log(`Processing resource: hive://accounts/${account}`);
    const accounts = await client.database.getAccounts(Array.isArray(account) ? account : [account]);
    if (accounts.length === 0) {
      throw new Error(`Account ${account} not found`);
    }
    const accountData = accounts[0];
    const text = JSON.stringify(accountData, null, 2);
    const response = { contents: [{ uri: uri.href, text }] };
    // console.log(`Resource response: ${JSON.stringify(response)}`);
    return response;
  }
);

// Resource 2: Fetch a specific post
server.resource(
  "post",
  new ResourceTemplate("hive://posts/{author}/{permlink}", { list: undefined }),
  async (uri, { author, permlink }) => {
    // console.log(`Processing resource: hive://posts/${author}/${permlink}`);
    const content = await client.database.call("get_content", [author, permlink]);
    if (!content.author) {
      throw new Error(`Post not found: ${author}/${permlink}`);
    }
    const text = JSON.stringify({
      title: content.title,
      author: content.author,
      body: content.body
    }, null, 2);
    const response = { contents: [{ uri: uri.href, text }] };
    // console.log(`Resource response: ${JSON.stringify(response)}`);
    return response;
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
  { 
    category: tagQueryCategories,
    tag: z.string(),
    limit: z.number().min(1).max(20).default(10)
  },
  async ({ category, tag, limit }) => {
    // console.log(`Processing tool: get_posts_by_tag with category=${category}, tag=${tag}, limit=${limit}`);
    try {
      const posts = await client.database.getDiscussions(category, { tag, limit });
      // console.log(`Fetched ${posts.length} posts for tag=${tag}`);
      
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
          text: JSON.stringify(formattedPosts, null, 2)
        }]
      };
    } catch (error) {
      if (error instanceof Error) {
        // console.error(`Error in get_posts_by_tag: ${error.message}`);
      } else {
        // console.error(`Error in get_posts_by_tag: ${String(error)}`);
      }
      throw error;
    }
  }
);

// Tool 2: Fetch posts by user ID
server.tool(
  "get_posts_by_user",
  { 
    category: userQueryCategories,
    username: z.string(),
    limit: z.number().min(1).max(20).default(10)
  },
  async ({ category, username, limit }) => {
    // console.log(`Processing tool: get_posts_by_user with category=${category}, username=${username}, limit=${limit}`);
    try {
      // For blog and feed queries, the username is provided as the tag parameter
      const posts = await client.database.getDiscussions(category, { tag: username, limit });
      // console.log(`Fetched ${posts.length} posts for username=${username}`);
      
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
          text: JSON.stringify(formattedPosts, null, 2)
        }]
      };
    } catch (error) {
      if (error instanceof Error) {
        // console.error(`Error in get_posts_by_user: ${error.message}`);
      } else {
        // console.error(`Error in get_posts_by_user: ${String(error)}`);
      }
      throw error;
    }
  }
);

// Start the server with standard MCP transport
const startServer = async () => {
  const transport = new StdioServerTransport();

  // Simplified error handling
  transport.onerror = (err) => {
    // console.error(`Transport error: ${err.message}`);
  };

  // console.log("Connecting server to transport...");
  await server.connect(transport);
  // console.log("Server started, waiting for input...");
};

startServer().catch((err) => console.error("Server failed to start:", err));

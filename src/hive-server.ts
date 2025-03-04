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
      return { contents: [{ uri: uri.href, text }] };
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
          text: JSON.stringify(formattedPosts, null, 2)
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
          text: JSON.stringify(formattedPosts, null, 2)
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

// Start the server with standard MCP transport
const startServer = async () => {
  const transport = new StdioServerTransport();
  await server.connect(transport);
};

startServer().catch((err) => console.error("Server failed to start:", err));

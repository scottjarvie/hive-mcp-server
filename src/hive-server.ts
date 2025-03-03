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
  { 
    category: tagQueryCategories,
    tag: z.string(),
    limit: z.number().min(1).max(20).default(10)
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
  { 
    category: userQueryCategories,
    username: z.string(),
    limit: z.number().min(1).max(20).default(10)
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

// src/hive-server.ts
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { Client } from "@hiveio/dhive";
import { z } from "zod";

// Initialize the Hive client with multiple RPC nodes for redundancy
const client = new Client([
  "https://api.hive.blog",
  "https://api.hivekings.com",
  "https://anyx.io",
  "https://api.openhive.network"
]);

// Create the MCP server
const server = new McpServer({ name: "HiveServer", version: "1.0.0" });

// Resource 1: Fetch account information
server.resource(
  "account",
  new ResourceTemplate("hive://accounts/{account}", { list: undefined }),
  async (uri, { account }) => {
    try {
      // Fetch account data from the Hive blockchain
      const accounts = await client.database.getAccounts(Array.isArray(account) ? account : [account]);
      if (accounts.length === 0) {
        throw new Error(`Account ${account} not found`);
      }
      const accountData = accounts[0];
      const text = JSON.stringify(accountData, null, 2);
      return { contents: [{ uri: uri.href, text }] };
    } catch (error) {
      throw error instanceof Error 
        ? error 
        : new Error(`Failed to fetch account: ${String(error)}`);
    }
  }
);

// Resource 2: Fetch a specific post
server.resource(
  "post",
  new ResourceTemplate("hive://posts/{author}/{permlink}", { list: undefined }),
  async (uri, { author, permlink }) => {
    try {
      // Fetch post content from the Hive blockchain
      const content = await client.database.call("get_content", [author, permlink]);
      if (!content.author) {
        throw new Error(`Post not found: ${author}/${permlink}`);
      }
      const text = `Title: ${content.title}\nAuthor: ${content.author}\nBody: ${content.body}`;
      return { contents: [{ uri: uri.href, text }] };
    } catch (error) {
      throw error instanceof Error 
        ? error 
        : new Error(`Failed to fetch post: ${String(error)}`);
    }
  }
);

// Tool: Fetch trending posts by tag
server.tool(
  "get_posts_by_tag",
  { tag: z.string() },
  async ({ tag }) => {
    try {
      // Fetch trending posts for a given tag
      const posts = await client.database.getDiscussions("trending", { tag, limit: 10 });
      const text = posts
        .map((post) => `Title: ${post.title}\nAuthor: ${post.author}\nPermlink: ${post.permlink}`)
        .join("\n\n");
      return { content: [{ type: "text" as const, text }] };
    } catch (error) {
      throw error instanceof Error 
        ? error 
        : new Error(`Failed to fetch posts: ${String(error)}`);
    }
  }
);

// Start the server
const startServer = async () => {
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
  } catch (error) {
    console.error("Server failed to start:", error);
    process.exit(1);
  }
};

// Run the server
startServer();

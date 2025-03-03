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

// Create the MCP server with a name and version
const server = new McpServer({ name: "HiveServer", version: "1.0.0" });

// Resource 1: Fetch account information
// URI: hive://accounts/{account}
server.resource(
  "account",
  new ResourceTemplate("hive://accounts/{account}", { list: undefined }),
  async (uri, { account }) => {
    const accounts = await client.database.getAccounts(Array.isArray(account) ? account : [account]);
    if (accounts.length === 0) {
      throw new Error(`Account ${account} not found`);
    }
    const accountData = accounts[0];
    const text = JSON.stringify(accountData, null, 2); // Pretty-print JSON
    return {
      contents: [{ uri: uri.href, text }],
    };
  }
);

// Resource 2: Fetch a specific post
// URI: hive://posts/{author}/{permlink}
server.resource(
  "post",
  new ResourceTemplate("hive://posts/{author}/{permlink}", { list: undefined }),
  async (uri, { author, permlink }) => {
    const content = await client.database.call('get_content', [author, permlink]);
    if (!content.author) {
      throw new Error(`Post not found: ${author}/${permlink}`);
    }
    const text = `Title: ${content.title}\nAuthor: ${content.author}\nBody: ${content.body}`;
    return {
      contents: [{ uri: uri.href, text }],
    };
  }
);

// Tool: Fetch trending posts by tag
// Name: get_posts_by_tag
server.tool(
  "get_posts_by_tag",
  { tag: z.string() }, // Input schema: expects a "tag" string
  async ({ tag }) => {
    const posts = await client.database.getDiscussions("trending", { tag, limit: 10 });
    const text = posts
      .map((post) => `Title: ${post.title}\nAuthor: ${post.author}\nPermlink: ${post.permlink}`)
      .join("\n\n");
    return {
      content: [{ type: "text", text }],
    };
  }
);

// Start the server using stdio transport (for local testing)
const startServer = async () => {
  const transport = new StdioServerTransport();
  await server.connect(transport);
};

startServer();


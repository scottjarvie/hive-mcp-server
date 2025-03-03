// test/hive-server.test.ts
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { MockStdioTransport } from "./mock-stdio";
import { Client } from "@hiveio/dhive";
import { z } from "zod";

// Initialize the Hive client with multiple RPC nodes for redundancy
const client = new Client([
  "https://api.hive.blog",
  "https://api.hivekings.com",
  "https://anyx.io",
  "https://api.openhive.network"
]);

// Utility function with increased timeout
async function waitForCondition(condition: () => boolean, timeout: number = 5000): Promise<void> {
  const start = Date.now();
  while (!condition()) {
    if (Date.now() - start > timeout) {
      throw new Error("Timeout waiting for condition");
    }
    await new Promise(resolve => setTimeout(resolve, 10));
  }
}

describe("Hive MCP Server", () => {
  let server: McpServer;
  let transport: MockStdioTransport;

  beforeEach(async () => {
    // Reset mocks before each test
    jest.clearAllMocks();
    
    transport = new MockStdioTransport();
    server = new McpServer({ name: "HiveServer", version: "1.0.0" });

    // Register account resource
    server.resource(
      "account",
      new ResourceTemplate("hive://accounts/{account}", { list: undefined }),
      async (uri, variables) => {
        const account = variables["account"];
        if (!account) {
          throw new Error("Missing account variable");
        }
        const accounts = await client.database.getAccounts(Array.isArray(account) ? account : [account]);
        if (accounts.length === 0) {
          throw new Error(`Account ${account} not found`);
        }
        const accountData = accounts[0];
        const text = JSON.stringify(accountData, null, 2);
        return {
          contents: [{ uri: uri.href, text }],
        };
      }
    );

    // Register post resource
    server.resource(
      "post",
      new ResourceTemplate("hive://posts/{author}/{permlink}", { list: undefined }),
      async (uri, variables) => {
        const author = variables["author"];
        const permlink = variables["permlink"];
        if (!author || !permlink) {
          throw new Error("Missing author or permlink variable");
        }
        const content = await client.database.call('get_content', [author, permlink]);
        if (!content.author) {
          throw new Error(`Post not found: ${author}/${permlink}`);
        }
        const text = JSON.stringify({
          title: content.title,
          author: content.author,
          body: content.body
        }, null, 2);
        return {
          contents: [{ uri: uri.href, text }],
        };
      }
    );

    // Valid discussion query categories for tag-based queries
    const tagQueryCategories = z.enum([
      'active', 'cashout', 'children', 'comments',
      'created', 'hot', 'promoted', 'trending', 'votes'
    ]);

    // Valid discussion query categories for user-based queries
    const userQueryCategories = z.enum(['blog', 'feed']);

    // Register tool to get posts by tag
    server.tool(
      "get_posts_by_tag",
      { 
        category: tagQueryCategories,
        tag: z.string(),
        limit: z.number().min(1).max(100).default(10)
      },
      async ({ category, tag, limit }) => {
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
            type: "text", 
            text: JSON.stringify(formattedPosts, null, 2)
          }],
        };
      }
    );

    // Register tool to get posts by user
    server.tool(
      "get_posts_by_user",
      { 
        category: userQueryCategories,
        username: z.string(),
        limit: z.number().min(1).max(100).default(10)
      },
      async ({ category, username, limit }) => {
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
            type: "text", 
            text: JSON.stringify(formattedPosts, null, 2)
          }],
        };
      }
    );

    // Connect server to our transport
    await server.connect(transport);
  });

  afterEach(() => {
    // Proper cleanup
    jest.clearAllMocks();
  });

  test("Account resource", async () => {
    const request = {
      type: "resource",
      uri: "hive://accounts/hiveio",
    };
    
    transport.simulateInput(JSON.stringify(request) + "\n");
    await waitForCondition(() => transport.responses.length > 0, 10000);

    const response = JSON.parse(transport.responses[0]);
    expect(response.type).toBe("resource");
    expect(response.contents[0].uri).toBe("hive://accounts/hiveio");
    expect(response.contents[0].text).toContain('"name": "hiveio"');
  });

  test("Post resource", async () => {
    const request = {
      type: "resource",
      uri: "hive://posts/hiveio/welcome-to-hive",
    };

    transport.simulateInput(JSON.stringify(request) + "\n");
    await waitForCondition(() => transport.responses.length > 0, 10000);

    const response = JSON.parse(transport.responses[0]);
    expect(response.type).toBe("resource");
    expect(response.contents[0].uri).toBe("hive://posts/hiveio/welcome-to-hive");
    expect(response.contents[0].text).toContain("title");
    expect(response.contents[0].text).toContain("author");
  });

  test("Get posts by tag tool", async () => {
    const request = {
      type: "tool",
      name: "get_posts_by_tag",
      input: { 
        category: "trending",
        tag: "hive",
        limit: 5
      },
    };

    transport.simulateInput(JSON.stringify(request) + "\n");
    await waitForCondition(() => transport.responses.length > 0, 10000);

    const response = JSON.parse(transport.responses[0]);
    expect(response.type).toBe("tool");
    expect(response.content[0].type).toBe("text");
    
    const posts = JSON.parse(response.content[0].text);
    expect(Array.isArray(posts)).toBe(true);
    if (posts.length > 0) {
      expect(posts[0]).toHaveProperty("title");
      expect(posts[0]).toHaveProperty("author");
      expect(posts[0]).toHaveProperty("permlink");
    }
  });

  test("Get posts by user tool", async () => {
    const request = {
      type: "tool",
      name: "get_posts_by_user",
      input: { 
        category: "blog", 
        username: "hiveio",
        limit: 5
      },
    };

    transport.simulateInput(JSON.stringify(request) + "\n");
    await waitForCondition(() => transport.responses.length > 0, 10000);

    const response = JSON.parse(transport.responses[0]);
    expect(response.type).toBe("tool");
    expect(response.content[0].type).toBe("text");
    
    const posts = JSON.parse(response.content[0].text);
    expect(Array.isArray(posts)).toBe(true);
    if (posts.length > 0) {
      expect(posts[0]).toHaveProperty("title");
      expect(posts[0]).toHaveProperty("author");
      expect(posts[0]).toHaveProperty("permlink");
    }
  });
});

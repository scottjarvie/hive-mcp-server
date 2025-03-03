// test/hive-server.test.ts
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { MockStdioTransport } from "./mock-stdio";
import { Client } from "@hiveio/dhive";
import { z } from "zod";

// Make sure to auto-mock the dhive module
// jest.mock('@hiveio/dhive');

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

    // Register account resource - same as your original
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

    // Register post resource - same as your original
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
        const text = `Title: ${content.title}\nAuthor: ${content.author}\nBody: ${content.body}`;
        return {
          contents: [{ uri: uri.href, text }],
        };
      }
    );

    // Register tool to get posts by tag - same as your original
    server.tool(
      "get_posts_by_tag",
      { tag: z.string() },
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

    // Connect server to our transport
    await server.connect(transport);
  });

  afterEach(() => {
    // Proper cleanup
    jest.clearAllMocks();
  });

  test("Account resource", async () => {
    // Add debug logging
    console.log("Starting Account resource test");
    
    const request = {
      type: "resource",
      uri: "hive://accounts/hiveio",
    };

    // Debug logging
    console.log("Sending request:", JSON.stringify(request));
    
    // Send the request
    transport.simulateInput(JSON.stringify(request) + "\n");

    // Debug logging
    console.log("Waiting for response...");
    
    // Wait for response with increased timeout
    await waitForCondition(() => {
      const hasResponses = transport.responses.length > 0;
      if (!hasResponses) {
        console.log("No responses yet...");
      } else {
        console.log("Got response:", transport.responses[0]);
      }
      return hasResponses;
    }, 10000); // 10 second timeout

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
    expect(response.contents[0].text).toContain("Title: Welcome to Hive");
  });

  test("Get posts by tag tool", async () => {
    const request = {
      type: "tool",
      name: "get_posts_by_tag",
      input: { tag: "hive" },
    };

    transport.simulateInput(JSON.stringify(request) + "\n");
    await waitForCondition(() => transport.responses.length > 0, 10000);

    const response = JSON.parse(transport.responses[0]);
    expect(response.type).toBe("tool");
    expect(response.content[0].type).toBe("text");
    expect(response.content[0].text).toContain("Title:");
    expect(response.content[0].text).toContain("Author:");
    expect(response.content[0].text).toContain("Permlink:");
  });
});

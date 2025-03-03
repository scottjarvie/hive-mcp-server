// test/hive-server.test.ts
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { MockStdioTransport } from "./mock-stdio";
import { Client } from "@hiveio/dhive";
import { z } from "zod";

// Mock the dhive module for faster, more reliable tests
// jest.mock('@hiveio/dhive');

// Utility function with increased timeout for waiting on async operations
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
  let mockClient: any;

  beforeEach(async () => {
    // Reset mocks before each test
    jest.clearAllMocks();
    
    // Initialize mock transport
    transport = new MockStdioTransport();
    
    // Create server instance
    server = new McpServer({ name: "HiveServer", version: "1.0.0" });

    // Initialize the Client mock
    mockClient = new Client([]);
    
    // Mock client database methods
    mockClient.database = {
      getAccounts: jest.fn().mockImplementation(async (accounts: string[]) => {
        if (accounts.includes('hiveio')) {
          return [{ name: 'hiveio', balance: '1000 HIVE', json_metadata: '{}' }];
        }
        return [];
      }),
      
      call: jest.fn().mockImplementation(async (method: string, params: any[]) => {
        if (method === 'get_content' && params[0] === 'hiveio' && params[1] === 'welcome-to-hive') {
          return {
            author: 'hiveio',
            permlink: 'welcome-to-hive',
            title: 'Welcome to Hive',
            body: 'This is the Hive blockchain.'
          };
        }
        return {};
      }),
      
      getDiscussions: jest.fn().mockImplementation(async (sort: string, query: any) => {
        if (query.tag === 'hive') {
          return [
            {
              title: 'Post 1',
              author: 'user1',
              permlink: 'post-1'
            },
            {
              title: 'Post 2',
              author: 'user2',
              permlink: 'post-2'
            }
          ];
        }
        return [];
      })
    };

    // Replace the real client with our mock in the test
    // (Client as jest.Mock).mockImplementation(() => mockClient);

    // Register account resource
    server.resource(
      "account",
      new ResourceTemplate("hive://accounts/{account}", { list: undefined }),
      async (uri, variables) => {
        const account = variables["account"];
        if (!account) {
          throw new Error("Missing account variable");
        }
        const accounts = await mockClient.database.getAccounts(Array.isArray(account) ? account : [account]);
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
        const content = await mockClient.database.call('get_content', [author, permlink]);
        if (!content.author) {
          throw new Error(`Post not found: ${author}/${permlink}`);
        }
        const text = `Title: ${content.title}\nAuthor: ${content.author}\nBody: ${content.body}`;
        return {
          contents: [{ uri: uri.href, text }],
        };
      }
    );

    // Register tool to get posts by tag
    server.tool(
      "get_posts_by_tag",
      { tag: z.string() },
      async ({ tag }) => {
        const posts = await mockClient.database.getDiscussions("trending", { tag, limit: 10 });
        const text = posts
          .map((post: any) => `Title: ${post.title}\nAuthor: ${post.author}\nPermlink: ${post.permlink}`)
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

  test("Account resource should return account information", async () => {
    // Create a request for the account resource
    const request = {
      type: "resource",
      uri: "hive://accounts/hiveio",
    };

    // Send the request
    transport.simulateInput(JSON.stringify(request) + "\n");

    // Wait for response
    await waitForCondition(() => transport.responses.length > 0, 10000);

    // Parse and validate the response
    const response = JSON.parse(transport.responses[0]);
    expect(response.type).toBe("resource");
    expect(response.contents[0].uri).toBe("hive://accounts/hiveio");
    expect(response.contents[0].text).toContain('"name": "hiveio"');
    expect(mockClient.database.getAccounts).toHaveBeenCalledWith(["hiveio"]);
  });

  test("Post resource should return post information", async () => {
    // Create a request for the post resource
    const request = {
      type: "resource",
      uri: "hive://posts/hiveio/welcome-to-hive",
    };

    // Send the request
    transport.simulateInput(JSON.stringify(request) + "\n");
    
    // Wait for response
    await waitForCondition(() => transport.responses.length > 0, 10000);

    // Parse and validate the response
    const response = JSON.parse(transport.responses[0]);
    expect(response.type).toBe("resource");
    expect(response.contents[0].uri).toBe("hive://posts/hiveio/welcome-to-hive");
    expect(response.contents[0].text).toContain("Title: Welcome to Hive");
    expect(mockClient.database.call).toHaveBeenCalledWith("get_content", ["hiveio", "welcome-to-hive"]);
  });

  test("Get posts by tag tool should return trending posts", async () => {
    // Create a request for the tool
    const request = {
      type: "tool",
      name: "get_posts_by_tag",
      input: { tag: "hive" },
    };

    // Send the request
    transport.simulateInput(JSON.stringify(request) + "\n");
    
    // Wait for response
    await waitForCondition(() => transport.responses.length > 0, 10000);

    // Parse and validate the response
    const response = JSON.parse(transport.responses[0]);
    expect(response.type).toBe("tool");
    expect(response.content[0].type).toBe("text");
    expect(response.content[0].text).toContain("Title: Post 1");
    expect(response.content[0].text).toContain("Author: user1");
    expect(mockClient.database.getDiscussions).toHaveBeenCalledWith("trending", { tag: "hive", limit: 10 });
  });
});

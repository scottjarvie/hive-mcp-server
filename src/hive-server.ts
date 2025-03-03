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
    console.log(`Processing resource: hive://accounts/${account}`);
    const accounts = await client.database.getAccounts(Array.isArray(account) ? account : [account]);
    if (accounts.length === 0) {
      throw new Error(`Account ${account} not found`);
    }
    const accountData = accounts[0];
    const text = JSON.stringify(accountData, null, 2);
    const response = { contents: [{ uri: uri.href, text }] };
    console.log(`Resource response: ${JSON.stringify(response)}`);
    return response;
  }
);

// Resource 2: Fetch a specific post
server.resource(
  "post",
  new ResourceTemplate("hive://posts/{author}/{permlink}", { list: undefined }),
  async (uri, { author, permlink }) => {
    console.log(`Processing resource: hive://posts/${author}/${permlink}`);
    const content = await client.database.call("get_content", [author, permlink]);
    if (!content.author) {
      throw new Error(`Post not found: ${author}/${permlink}`);
    }
    const text = `Title: ${content.title}\nAuthor: ${content.author}\nBody: ${content.body}`;
    const response = { contents: [{ uri: uri.href, text }] };
    console.log(`Resource response: ${JSON.stringify(response)}`);
    return response;
  }
);

// Tool: Fetch trending posts by tag
server.tool(
  "get_posts_by_tag",
  { tag: z.string() },
  async ({ tag }) => {
    console.log(`Processing tool: get_posts_by_tag with tag=${tag}`);
    try {
      const posts = await client.database.getDiscussions("trending", { tag, limit: 10 });
      console.log(`Fetched ${posts.length} posts for tag=${tag}`);
      const text = posts
        .map((post) => `Title: ${post.title}\nAuthor: ${post.author}\nPermlink: ${post.permlink}`)
        .join("\n\n");
      const response = { content: [{ type: "text" as const, text }] };
      console.log(`Tool response: ${JSON.stringify(response)}`);
      return response;
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Error in get_posts_by_tag: ${error.message}`);
      } else {
        console.error(`Error in get_posts_by_tag: ${String(error)}`);
      }
      throw error;
    }
  }
);

// Start the server with verbose logging and manual dispatch
const startServer = async () => {
  const transport = new StdioServerTransport();

  // Log transport events (if supported)
  transport.onmessage = (msg: any) => {
    console.log(`Transport received message: ${JSON.stringify(msg)}`);
  };
  transport._ondata = (data: Buffer) => {
    console.log(`Transport received data: ${data.toString().trim()}`);
  };
  transport.onerror = (err) => {
    console.error(`Transport error: ${err.message}`);
  };

  console.log("Connecting server to transport...");
  await server.connect(transport);
  console.log("Server started, waiting for input...");

  // Manually handle stdin for both tools and resources
  process.stdin
    .setEncoding("utf8")
    .on("data", async (data) => {
      console.log(`Stdin received: ${data.toString().trim()}`);
      try {
        const request = JSON.parse(data.toString());
        if (request.type === "tool" && request.name === "get_posts_by_tag") {
          console.log("Manually handling tool request...");
          const result = await server.tool(request.name, request.input);
          console.log(`Manual tool result: ${JSON.stringify(result)}`);
          process.stdout.write(JSON.stringify(result) + "\n");
        } else if (request.type === "resource" && request.uri.startsWith("hive://accounts/")) {
          console.log("Manually handling account resource request...");
          const account = request.uri.split("/").pop(); // Extract account name
          const uri = new URL(request.uri);
          const result = await server.resource("account", uri.href, async () => {
            const accounts = await client.database.getAccounts([account]);
            if (accounts.length === 0) {
              throw new Error(`Account ${account} not found`);
            }
            return { contents: [{ uri: uri.href, text: JSON.stringify(accounts[0], null, 2) }] };
          });
          console.log(`Manual resource result: ${JSON.stringify(result)}`);
          process.stdout.write(JSON.stringify(result) + "\n");
        } else {
          console.log("Request type or URI not recognized, passing to transport.");
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error(`Error processing stdin: ${errorMessage}`);
        process.stdout.write(JSON.stringify({ error: errorMessage }) + "\n");
      }
    })
    .on("error", (err) => {
      console.error(`Stdin error: ${err.message}`);
    });
};

startServer().catch((err) => console.error("Server failed to start:", err));

// src/diagnostic-tool-server.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// Create the MCP server
const server = new McpServer({ 
  name: "ToolDiagnosticServer", 
  version: "1.0.0",
  capabilities: {
    tools: {} // Explicitly enable tools capability
  }
});

// Register a simple tool
server.tool(
  "echo",
  { message: z.string() },
  async ({ message }) => {
    return { 
      content: [{ 
        type: "text" as const, 
        text: `You said: ${message}` 
      }] 
    };
  }
);

// Register another tool with different input format
server.tool(
  "add",
  { 
    a: z.number(), 
    b: z.number() 
  },
  async ({ a, b }) => {
    return { 
      content: [{ 
        type: "text" as const, 
        text: `${a} + ${b} = ${a + b}` 
      }] 
    };
  }
);

// Start the server
const startServer = async () => {
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    
    console.error("Server started and connected to transport");
  } catch (error) {
    console.error("Server failed to start:", error);
    process.exit(1);
  }
};

// Run the server
startServer();
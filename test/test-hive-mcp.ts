#!/usr/bin/env ts-node
/**
 * Test script for Hive MCP Server in TypeScript
 * 
 * This script tests the Hive MCP server by running it and sending requests to verify
 * functionality. It helps verify that the server is configured correctly and can be 
 * used with AI assistants like Claude.
 * 
 * Usage:
 *   npx ts-node test/test-hive-mcp.ts
 */

import { spawn, ChildProcessWithoutNullStreams } from 'node:child_process';
import * as path from 'node:path';
import * as fs from 'node:fs';
import 'dotenv/config';

// Interface for JSON-RPC request
interface JsonRpcRequest {
  jsonrpc: string;
  id: number;
  method: string;
  params: Record<string, any>;
}

// Interface for JSON-RPC response
interface JsonRpcResponse {
  jsonrpc: string;
  id: number;
  result?: any;
  error?: {
    code: number;
    message: string;
  };
}

// Check if required environment variables are set
const recommendedEnvVars = [
  'HIVE_USERNAME',
  'HIVE_POSTING_KEY',
  'HIVE_ACTIVE_KEY',
  'HIVE_MEMO_KEY'
];

const missingEnvVars = recommendedEnvVars.filter(varName => !process.env[varName]);
if (missingEnvVars.length > 0) {
  process.stderr.write(`Warning: Some recommended environment variables are missing: ${missingEnvVars.join(', ')}\n`);
  process.stderr.write('Some functionality may be limited without these variables.\n');
}

// Path to the built MCP server
const serverPath = path.join(__dirname, '../dist', 'index.js');

// Check if the server file exists
if (!fs.existsSync(serverPath)) {
  process.stderr.write(`Error: Server file not found at ${serverPath}\n`);
  process.stderr.write('Please make sure you have built the project with "npm run build".\n');
  process.exit(1);
}

process.stderr.write('Starting Hive MCP server test...\n');

// Start the MCP server
const server: ChildProcessWithoutNullStreams = spawn('node', [serverPath], {
  stdio: ['pipe', 'pipe', 'pipe'],
  env: process.env
});

// Handle server output
server.stderr.on('data', (data: Buffer) => {
  process.stderr.write(`[Server Log] ${data.toString().trim()}\n`);
});

// Wait for server to start
setTimeout(() => {
  process.stderr.write('\nSending requests to test Hive MCP Server...\n');
  
  // First request - list tools
  const listToolsRequest: JsonRpcRequest = {
    jsonrpc: "2.0",
    id: 1,
    method: "tools/list",
    params: {}
  };
  
  process.stderr.write('\nSending tools/list request...\n');
  server.stdin.write(JSON.stringify(listToolsRequest) + '\n');
  
  // Track responses to handle them sequentially
  let responseCount = 0;
  
  // Listen for responses
  server.stdout.on('data', (data: Buffer) => {
    try {
      const responseText = data.toString().trim();
      // Parse the response but don't log the raw output
      const response: JsonRpcResponse = JSON.parse(responseText);
      responseCount++;
      
      if (responseCount === 1) {
        // Handle first response - tools/list
        process.stderr.write('\nTools available on the server:\n');
        // Display a clean list of tools without the full schema details
        if (response.result && response.result.tools) {
          const tools = response.result.tools;
          tools.forEach((tool: { name: string; description: string }) => {
            process.stderr.write(`- ${tool.name}: ${tool.description}\n`);
          });
        }
        
        if (response.result && response.result.tools) {
          process.stderr.write('\n✅ tools/list test successful!\n');
          process.stderr.write(`\nFound ${response.result.tools.length} tools available.\n`);
          
          // Now send the second request - test get_chain_properties
          process.stderr.write('\nTesting tools/call with get_chain_properties...\n');
          
          const callChainPropertiesRequest: JsonRpcRequest = {
            jsonrpc: "2.0",
            id: 2,
            method: "tools/call",
            params: {
              name: "get_chain_properties",
              arguments: {}
            }
          };
          
          server.stdin.write(JSON.stringify(callChainPropertiesRequest) + '\n');
        } else {
          process.stderr.write('\n❌ tools/list test failed.\n');
          process.stderr.write(`Error: ${response.error ? response.error.message : 'Unknown error'}\n`);
          server.kill();
          process.exit(1);
        }
      } else if (responseCount === 2) {
        // Handle second response - get_chain_properties call
        process.stderr.write('\nHive blockchain properties:\n');
        try {
          // Parse the chain properties from the text content
          const chainData = JSON.parse(response.result.content[0].text);
          
          // Display only the most interesting fields
          process.stderr.write(`- Current HBD price: ${chainData.current_median_history_price.base}\n`);
          process.stderr.write(`- Current supply: ${chainData.dynamic_properties.current_supply}\n`);
          process.stderr.write(`- HBD supply: ${chainData.dynamic_properties.current_hbd_supply}\n`);
          process.stderr.write(`- Account creation fee: ${chainData.chain_properties.account_creation_fee}\n`);
          process.stderr.write(`- HBD interest rate: ${chainData.chain_properties.hbd_interest_rate / 100}%\n`);
          process.stderr.write(`- Last block: ${chainData.dynamic_properties.head_block_number}\n`);
          process.stderr.write(`- Time: ${chainData.dynamic_properties.time}\n`);
        } catch (error) {
          // Fallback if there's an issue parsing the JSON
          process.stderr.write(JSON.stringify(response, null, 2).substring(0, 300) + '...\n');
        }
        
        if (response.result && !response.error) {
          process.stderr.write('\n✅ get_chain_properties test successful!\n');
          
          // Now call get_account_info for a known account
          const testUsername = process.env.HIVE_USERNAME || "helo";
          process.stderr.write(`\nTesting tools/call with get_account_info for ${testUsername}...\n`);
          
          const callAccountInfoRequest: JsonRpcRequest = {
            jsonrpc: "2.0",
            id: 3,
            method: "tools/call",
            params: {
              name: "get_account_info",
              arguments: {
                username: testUsername
              }
            }
          };
          
          server.stdin.write(JSON.stringify(callAccountInfoRequest) + '\n');
        } else {
          process.stderr.write('\n❌ get_chain_properties test failed.\n');
          process.stderr.write(`Error: ${response.error ? response.error.message : 'Unknown error'}\n`);
          server.kill();
          process.exit(1);
        }
      } else if (responseCount === 3) {
        // Handle third response - get_account_info
        process.stderr.write('\nAccount information:\n');
        try {
          // Parse the account info from the text content
          const accountData = JSON.parse(response.result.content[0].text);
          
          // Display only the most interesting fields
          process.stderr.write(`- Account name: ${accountData.name}\n`);
          process.stderr.write(`- Created: ${accountData.created}\n`);
          process.stderr.write(`- HIVE balance: ${accountData.balance}\n`);
          process.stderr.write(`- HBD balance: ${accountData.hbd_balance}\n`);
          process.stderr.write(`- Post count: ${accountData.post_count}\n`);
          process.stderr.write(`- Voting power: ${(accountData.voting_power / 100).toFixed(2)}%\n`);
          
          // Try to parse the JSON metadata for the location
          try {
            const jsonMetadata = JSON.parse(accountData.json_metadata);
            const location = jsonMetadata.profile?.location || 'Not specified';
            process.stderr.write(`- Location: ${location}\n`);
          } catch {
            process.stderr.write(`- Location: Not specified\n`);
          }
          
          // Show witness votes if there are any
          if (accountData.witness_votes && accountData.witness_votes.length > 0) {
            process.stderr.write(`- Witnesses voted for: ${accountData.witnesses_voted_for}\n`);
            process.stderr.write(`- Recent votes: ${accountData.witness_votes.slice(0, 5).join(', ')}${
              accountData.witness_votes.length > 5 ? '...' : ''
            }\n`);
          }
        } catch (error) {
          // Fallback if there's an issue parsing the JSON
          process.stderr.write(JSON.stringify(response, null, 2).substring(0, 300) + '...\n');
        }
        
        if (response.result && !response.error) {
          process.stderr.write('\n✅ get_account_info test successful!\n');
          
          // Finally, test getting trending posts from a tag
          process.stderr.write('\nTesting tools/call with get_posts_by_tag for "hive"...\n');
          
          const callPostsByTagRequest: JsonRpcRequest = {
            jsonrpc: "2.0",
            id: 4,
            method: "tools/call",
            params: {
              name: "get_posts_by_tag",
              arguments: {
                category: "trending",
                tag: "hive",
                limit: 3
              }
            }
          };
          
          server.stdin.write(JSON.stringify(callPostsByTagRequest) + '\n');
        } else {
          process.stderr.write('\n❌ get_account_info test failed.\n');
          process.stderr.write(`Error: ${response.error ? response.error.message : 'Unknown error'}\n`);
          process.stderr.write('\nTest complete. Terminating server.\n');
          server.kill();
          process.exit(1);
        }
      } else if (responseCount === 4) {
        // Handle fourth response - get_posts_by_tag
        process.stderr.write('\nTrending posts with #hive tag:\n');
        try {
          // Parse the posts from the text content
          const posts = JSON.parse(response.result.content[0].text);
          
          // Display each post in a readable format
          posts.forEach((post: any, index: number) => {
            process.stderr.write(`\n[Post ${index + 1}]\n`);
            process.stderr.write(`- Title: ${post.title}\n`);
            process.stderr.write(`- Author: @${post.author}\n`);
            process.stderr.write(`- Created: ${post.created}\n`);
            process.stderr.write(`- Pending payout: ${post.payout}\n`);
            process.stderr.write(`- URL: ${post.url}\n`);
          });
        } catch (error) {
          // Fallback if there's an issue parsing the JSON
          process.stderr.write(JSON.stringify(response, null, 2).substring(0, 300) + '...\n');
        }
        
        if (response.result && !response.error) {
          process.stderr.write('\n✅ get_posts_by_tag test successful!\n');
          process.stderr.write('\nAll tests passed successfully!\n');
        } else {
          process.stderr.write('\n❌ get_posts_by_tag test failed.\n');
          process.stderr.write(`Error: ${response.error ? response.error.message : 'Unknown error'}\n`);
        }
        
        process.stderr.write('\nTest complete. Terminating server.\n');
        server.kill();
        process.exit(0);
      }
    } catch (error) {
      process.stderr.write(`Error parsing server response: ${error instanceof Error ? error.message : String(error)}\n`);
      server.kill();
      process.exit(1);
    }
  });
  
  // Set a timeout to terminate the test if it takes too long
  setTimeout(() => {
    process.stderr.write('\nTest timed out. Terminating server.\n');
    server.kill();
    process.exit(1);
  }, 15000);
}, 2000);

// Handle server errors
server.on('error', (error: Error) => {
  process.stderr.write(`Server error: ${error.message}\n`);
  process.exit(1);
});

// Handle server exit
server.on('close', (code: number | null) => {
  if (code !== 0 && code !== null) {
    process.stderr.write(`Server exited with code ${code}\n`);
    process.exit(1);
  }
});

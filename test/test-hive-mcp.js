#!/usr/bin/env node
/**
 * Test script for Hive MCP Server
 * 
 * This script tests the Hive MCP server by running it and sending requests to verify
 * functionality. It helps verify that the server is configured correctly and can be 
 * used with AI assistants like Claude.
 * 
 * Usage:
 *   node test-hive-mcp.js
 */
const { spawn } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');
require('dotenv').config();

// Check if required environment variables are set
const recommendedEnvVars = [
  'HIVE_USERNAME',
  'HIVE_POSTING_KEY',
  'HIVE_ACTIVE_KEY',
  'HIVE_MEMO_KEY'
];

const missingEnvVars = recommendedEnvVars.filter(varName => !process.env[varName]);
if (missingEnvVars.length > 0) {
  console.warn(`Warning: Some recommended environment variables are missing: ${missingEnvVars.join(', ')}`);
  console.warn('Some functionality may be limited without these variables.');
}

// Path to the built MCP server
const serverPath = path.join(__dirname, '../dist', 'index.js');

// Check if the server file exists
if (!fs.existsSync(serverPath)) {
  console.error(`Error: Server file not found at ${serverPath}`);
  console.error('Please make sure you have built the project with "npm run build".');
  process.exit(1);
}

console.log('Starting Hive MCP server test...');

// Start the MCP server
const server = spawn('node', [serverPath], {
  stdio: ['pipe', 'pipe', 'pipe'],
  env: process.env
});

// Handle server output
server.stderr.on('data', (data) => {
  console.log(`[Server Log] ${data.toString().trim()}`);
});

// Wait for server to start
setTimeout(() => {
  console.log('\nSending requests to test Hive MCP Server...');
  
  // First request - list tools
  const listToolsRequest = {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list",
    "params": {}
  };
  
  console.log('\nSending tools/list request...');
  server.stdin.write(JSON.stringify(listToolsRequest) + '\n');
  
  // Track responses to handle them sequentially
  let responseCount = 0;
  
  // Listen for responses
  server.stdout.on('data', (data) => {
    try {
      const responseText = data.toString().trim();
      // Parse the response but don't log the raw output
      const response = JSON.parse(responseText);
      responseCount++;
      
      if (responseCount === 1) {
        // Handle first response - tools/list
        console.log('\nTools available on the server:');
        // Display a clean list of tools without the full schema details
        if (response.result && response.result.tools) {
          const tools = response.result.tools;
          tools.forEach(tool => {
            console.log(`- ${tool.name}: ${tool.description}`);
          });
        }
        
        if (response.result && response.result.tools) {
          console.log('\n✅ tools/list test successful!');
          console.log(`\nFound ${response.result.tools.length} tools available.`)
          
          // Now send the second request - test get_chain_properties
          console.log('\nTesting tools/call with get_chain_properties...');
          
          const callChainPropertiesRequest = {
            "jsonrpc": "2.0",
            "id": 2,
            "method": "tools/call",
            "params": {
              "name": "get_chain_properties",
              "arguments": {}
            }
          };
          
          server.stdin.write(JSON.stringify(callChainPropertiesRequest) + '\n');
        } else {
          console.log('\n❌ tools/list test failed.');
          console.log('Error:', response.error || 'Unknown error');
          server.kill();
          process.exit(1);
        }
      } else if (responseCount === 2) {
        // Handle second response - get_chain_properties call
        console.log('\nHive blockchain properties:');
        try {
          // Parse the chain properties from the text content
          const chainData = JSON.parse(response.result.content[0].text);
          
          // Display only the most interesting fields
          console.log(`- Current HBD price: ${chainData.current_median_history_price.base}`);
          console.log(`- Current supply: ${chainData.dynamic_properties.current_supply}`);
          console.log(`- HBD supply: ${chainData.dynamic_properties.current_hbd_supply}`);
          console.log(`- Account creation fee: ${chainData.chain_properties.account_creation_fee}`);
          console.log(`- HBD interest rate: ${chainData.chain_properties.hbd_interest_rate / 100}%`);
          console.log(`- Last block: ${chainData.dynamic_properties.head_block_number}`);
          console.log(`- Time: ${chainData.dynamic_properties.time}`);
        } catch (error) {
          // Fallback if there's an issue parsing the JSON
          console.log(JSON.stringify(response, null, 2).substring(0, 300) + '...');
        }
        
        if (response.result && !response.error) {
          console.log('\n✅ get_chain_properties test successful!');
          
          // Now call get_account_info for a known account
          const testUsername = process.env.HIVE_USERNAME || "helo";
          console.log(`\nTesting tools/call with get_account_info for ${testUsername}...`);
          
          const callAccountInfoRequest = {
            "jsonrpc": "2.0",
            "id": 3,
            "method": "tools/call",
            "params": {
              "name": "get_account_info",
              "arguments": {
                "username": testUsername
              }
            }
          };
          
          server.stdin.write(JSON.stringify(callAccountInfoRequest) + '\n');
        } else {
          console.log('\n❌ get_chain_properties test failed.');
          console.log('Error:', response.error || 'Unknown error');
          server.kill();
          process.exit(1);
        }
      } else if (responseCount === 3) {
        // Handle third response - get_account_info
        console.log('\nAccount information:');
        try {
          // Parse the account info from the text content
          const accountData = JSON.parse(response.result.content[0].text);
          
          // Display only the most interesting fields
          console.log(`- Account name: ${accountData.name}`);
          console.log(`- Created: ${accountData.created}`);
          console.log(`- HIVE balance: ${accountData.balance}`);
          console.log(`- HBD balance: ${accountData.hbd_balance}`);
          console.log(`- Post count: ${accountData.post_count}`);
          console.log(`- Voting power: ${(accountData.voting_power / 100).toFixed(2)}%`);
          console.log(`- Location: ${JSON.parse(accountData.json_metadata).profile?.location || 'Not specified'}`);
          
          // Show witness votes if there are any
          if (accountData.witness_votes && accountData.witness_votes.length > 0) {
            console.log(`- Witnesses voted for: ${accountData.witnesses_voted_for}`);
            console.log(`- Recent votes: ${accountData.witness_votes.slice(0, 5).join(', ')}${
              accountData.witness_votes.length > 5 ? '...' : ''
            }`);
          }
        } catch (error) {
          // Fallback if there's an issue parsing the JSON
          console.log(JSON.stringify(response, null, 2).substring(0, 300) + '...');
        }
        
        if (response.result && !response.error) {
          console.log('\n✅ get_account_info test successful!');
          
          // Finally, test getting trending posts from a tag
          console.log('\nTesting tools/call with get_posts_by_tag for "hive"...');
          
          const callPostsByTagRequest = {
            "jsonrpc": "2.0",
            "id": 4,
            "method": "tools/call",
            "params": {
              "name": "get_posts_by_tag",
              "arguments": {
                "category": "trending",
                "tag": "hive",
                "limit": 3
              }
            }
          };
          
          server.stdin.write(JSON.stringify(callPostsByTagRequest) + '\n');
        } else {
          console.log('\n❌ get_account_info test failed.');
          console.log('Error:', response.error || 'Unknown error');
          console.log('\nTest complete. Terminating server.');
          server.kill();
          process.exit(1);
        }
      } else if (responseCount === 4) {
        // Handle fourth response - get_posts_by_tag
        console.log('\nTrending posts with #hive tag:');
        try {
          // Parse the posts from the text content
          const posts = JSON.parse(response.result.content[0].text);
          
          // Display each post in a readable format
          posts.forEach((post, index) => {
            console.log(`\n[Post ${index + 1}]`);
            console.log(`- Title: ${post.title}`);
            console.log(`- Author: @${post.author}`);
            console.log(`- Created: ${post.created}`);
            console.log(`- Pending payout: ${post.payout}`);
            console.log(`- URL: ${post.url}`);
          });
        } catch (error) {
          // Fallback if there's an issue parsing the JSON
          console.log(JSON.stringify(response, null, 2).substring(0, 300) + '...');
        }
        
        if (response.result && !response.error) {
          console.log('\n✅ get_posts_by_tag test successful!');
          console.log('\nAll tests passed successfully!');
        } else {
          console.log('\n❌ get_posts_by_tag test failed.');
          console.log('Error:', response.error || 'Unknown error');
        }
        
        console.log('\nTest complete. Terminating server.');
        server.kill();
        process.exit(0);
      }
    } catch (error) {
      console.error('Error parsing server response:', error);
      server.kill();
      process.exit(1);
    }
  });
  
  // Set a timeout to terminate the test if it takes too long
  setTimeout(() => {
    console.log('\nTest timed out. Terminating server.');
    server.kill();
    process.exit(1);
  }, 15000);
}, 2000);

// Handle server errors
server.on('error', (error) => {
  console.error('Server error:', error);
  process.exit(1);
});

// Handle server exit
server.on('close', (code) => {
  if (code !== 0 && code !== null) {
    console.error(`Server exited with code ${code}`);
    process.exit(1);
  }
});

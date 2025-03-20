#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerTools, registerPrompts } from './tools';
import { validatePrivateKey, getConfig } from './config';
import logger from './utils/logger';

const startServer = async () => {
  const config = getConfig();
  
  // Set log level
  logger.setLogLevel(config.log.logLevel);

  // Check environment variables and log status
  if (!config.hive.username) {
    logger.warn('Warning: HIVE_USERNAME environment variable is not set');
  } else {
    logger.info(`Info: Using Hive account: ${config.hive.username}`);
  }

  // Check posting key
  if (!config.hive.postingKey) {
    logger.warn('Warning: HIVE_POSTING_KEY environment variable is not set');
  } else {
    logger.info('Info: HIVE_POSTING_KEY is set');

    // Validate private key format (without logging the actual key)
    if (validatePrivateKey(config.hive.postingKey)) {
      logger.info('Info: HIVE_POSTING_KEY is valid');
    } else {
      logger.warn('Warning: HIVE_POSTING_KEY is not a valid private key');
    }
  }

  // Check active key
  if (!config.hive.activeKey) {
    logger.warn('Warning: HIVE_ACTIVE_KEY environment variable is not set (required for token transfers)');
  } else {
    logger.info('Info: HIVE_ACTIVE_KEY is set');

    // Validate active key format
    if (validatePrivateKey(config.hive.activeKey)) {
      logger.info('Info: HIVE_ACTIVE_KEY is valid');
    } else {
      logger.warn('Warning: HIVE_ACTIVE_KEY is not a valid private key');
    }
  }

  // Check memo key
  if (!config.hive.memoKey) {
    logger.warn('Warning: HIVE_MEMO_KEY environment variable is not set');
  } else {
    logger.info('Info: HIVE_MEMO_KEY is set');

    // Validate memo key format
    if (validatePrivateKey(config.hive.memoKey)) {
      logger.info('Info: HIVE_MEMO_KEY is valid');
    } else {
      logger.warn('Warning: HIVE_MEMO_KEY is not a valid private key');
    }
  }

  // Create and configure the server
  const server = new McpServer({ 
    name: config.server.name, 
    version: config.server.version 
  });

  // Register tools
  registerTools(server);
  registerPrompts(server);

  // Connect to the transport
  const transport = new StdioServerTransport();
  await server.connect(transport);
};

// Start the server and handle any errors
startServer().catch((err) => {
  // Use logger.error instead of console.error
  logger.error(`Server failed to start: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});

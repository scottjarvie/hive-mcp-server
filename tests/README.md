# Hive MCP Server Tests

This directory contains tests for the Hive MCP Server.

## Test Organization

The tests are organized to mirror the project structure:

- `tests/tools/` - Tests for tool implementations
  - `account.test.ts` - Tests for account-related tools
  - `blockchain.test.ts` - Tests for blockchain-related tools
  - `crypto.test.ts` - Tests for cryptography tools
- `tests/utils/` - Tests for utility functions
  - `response.test.ts` - Tests for response formatting utilities
- `tests/config/` - Tests for configuration modules
  - `client.test.ts` - Tests for Hive client configuration
  - `index.test.ts` - Tests for general configuration handling
- `tests/integration.test.ts` - Integration tests across multiple modules

## Running Tests

To run all tests:

```bash
npm test
```

To run specific test categories:

```bash
# Run only the account tests
npm run test:account

# Run only the blockchain tests
npm run test:blockchain

# Run tests in watch mode (auto-rerun on file changes)
npm run test:watch
```

## Environment Variables

Tests will use the environment variables configured in your `.env` file or the current environment.
For authenticated tests, the following variables are required:

```
HIVE_USERNAME=your-hive-username
HIVE_POSTING_KEY=your-hive-posting-private-key
HIVE_ACTIVE_KEY=your-hive-active-private-key
HIVE_MEMO_KEY=your-hive-memo-private-key
```

If these variables are not available, tests that require authentication will be skipped.

## Test Philosophy

These tests aim to:

1. Validate that each tool functions correctly in isolation
2. Ensure the tools interact properly with the Hive blockchain
3. Verify error handling for various edge cases
4. Test the integration between different modules

The tests do not use mocks but instead interact with the actual Hive blockchain.
This provides more realistic testing but also means that tests may occasionally fail due to
network issues or changes in the blockchain state.

## Adding New Tests

When adding new tools or modifying existing ones, please maintain the same test structure:

1. Create unit tests for each tool function
2. Test both success and failure cases
3. Verify that error messages are informative
4. Add integration tests for new functionality that interacts with other components

All tests should be written in TypeScript and follow the existing patterns.

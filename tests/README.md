# Testing Guide for Hive MCP Server

This guide explains how to properly run tests for the Hive MCP Server project.

## Test Structure

The tests are organized to mirror the project structure:

- `tests/tools/` - Tests for tool implementations
  - `account.test.ts` - Tests for account-related tools
  - `blockchain.test.ts` - Tests for blockchain-related tools
  - `crypto.test.ts` - Tests for cryptography tools
- `tests/utils/` - Tests for utility functions
  - `response.test.ts` - Tests for response formatting utilities
- `tests/config/` - Tests for configuration modules
  - `client.test.ts` - Tests for the Hive client configuration
- `tests/integration.test.ts` - Integration tests across multiple modules

## Prerequisites

Before running tests, make sure you have:

1. Node.js (v16 or later) installed
2. NPM or Yarn installed
3. Run `npm install` to install all dependencies
4. Set up environment variables (see below)

## Environment Variables

Some tests require authentication with the Hive blockchain. To run these tests, you'll need to set up the following environment variables:

```bash
export HIVE_USERNAME=your-hive-username
export HIVE_POSTING_KEY=your-hive-posting-private-key
export HIVE_ACTIVE_KEY=your-hive-active-private-key
export HIVE_MEMO_KEY=your-hive-memo-private-key
```

If these environment variables are not set, tests requiring authentication will be automatically skipped.

You can create a `.env` file in the project root with these variables instead of setting them in your shell environment:

```
HIVE_USERNAME=your-hive-username
HIVE_POSTING_KEY=your-hive-posting-private-key
HIVE_ACTIVE_KEY=your-hive-active-private-key
HIVE_MEMO_KEY=your-hive-memo-private-key
```

## Running Tests

### All Tests

To run all tests:

```bash
npm test
```

### Specific Test Categories

To run specific test files:

```bash
npx jest tests/config/client.test.ts
npx jest tests/tools/blockchain.test.ts
```

### Watch Mode

To run tests in watch mode (auto-rerun on file changes):

```bash
npx jest --watch
```

## Test Philosophy

These tests aim to:

1. Validate that each tool functions correctly in isolation
2. Ensure the tools interact properly with the Hive blockchain
3. Verify error handling for various edge cases
4. Test the integration between different modules

The tests do not use mocks but instead interact with the actual Hive blockchain.
This provides more realistic testing but also means that tests may occasionally fail due to
network issues or changes in the blockchain state.

## Troubleshooting

### Test failures due to network issues

If tests fail with timeout or network errors, try running them again after a few minutes. The Hive blockchain API nodes might be temporarily unavailable or overloaded.

### Tests failing due to missing environment variables

If tests are failing because they need authentication, make sure your environment variables are correctly set. You can check this with:

```bash
echo $HIVE_USERNAME
```

### Running tests with different configurations

You can temporarily modify the tests to use different settings by editing the `jest.config.js` file. For example, to increase the timeout for API calls:

```javascript
// in jest.config.js
module.exports = {
  // ...other settings
  testTimeout: 30000, // increase to 30 seconds
  // ...
};
```

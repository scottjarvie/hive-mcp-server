# Agent Guidelines for hive-mcp-server

This repository contains a Model Context Protocol (MCP) server written in **TypeScript** for interacting with the Hive blockchain. When contributing, keep the following conventions and tooling in mind.

## Key Frameworks and Libraries

- **@modelcontextprotocol/sdk** – Provides `McpServer` and the stdio transport used in `src/index.ts`.
- **@hiveio/dhive** – Hive blockchain client used throughout the tools and configuration.
- **zod** – Input validation for all tool schemas (see `src/schemas`).
- **jest** with **ts-jest** – Test runner configured in `jest.config.js`.

## Project Layout

```
src/          TypeScript source files
  tools/      Implementation of all MCP tools
  schemas/    Zod schemas for tool parameters
  utils/      Shared utilities (logger, response helpers, etc.)
  config/     Environment and client configuration
tests/        Jest test suite (interacts with the real Hive blockchain)
dist/         Compiled output (generated, not committed)
```

## Style and Development Conventions

- Use **TypeScript** with the settings in `tsconfig.json` (strict mode enabled).
- Prefer arrow functions and keep indentation at **2 spaces**. Semicolons are used.
- Avoid `console.log` or `console.error`; instead use the logging helpers in `src/utils/logger.ts`.
- Input validation is performed with Zod schemas located in `src/schemas`. Follow this pattern for new tools.
- Keep secret values such as private keys out of the repository. They are loaded from environment variables (`HIVE_USERNAME`, `HIVE_POSTING_KEY`, etc.).
- Commit messages should follow the **Conventional Commits** format (`feat:`, `fix:`, `docs:`, `test:` ...).
- Do not commit build artifacts from `dist/`.

## Testing

- Run the full test suite with `npm test`. Tests rely on real Hive API nodes and may require environment variables set as described in `tests/README.md`.
- `dotenv` is loaded in the test setup, so you can place credentials in a local `.env` file (ignored by Git).

## Adding Tools or Prompts

1. Create or update Zod schemas in `src/schemas`.
2. Implement the logic in a file under `src/tools`.
3. Register the tool or prompt in `src/tools/index.ts` using `server.tool()` or `server.prompt()`.
4. Provide tests in `tests/` to cover the new functionality.

## Running the Server

The compiled server entry point is `dist/index.js`. During development, build with `npm run build` (triggered automatically by `npm prepare`) and run using `npm start` or via the MCP Inspector.


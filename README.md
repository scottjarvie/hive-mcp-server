# Hive MCP Server

An MCP server that enables AI assistants to interact with the Hive blockchain through the Model Context Protocol.

## Overview

This server provides a bridge between AI assistants (like Claude) and the Hive blockchain, allowing AI models to:

- Fetch account information and history
- Retrieve blog posts and discussions
- Get posts by tag or user
- Vote on content (when properly authenticated)

## Features

### Resources

- `hive://accounts/{account}` - Get detailed account information
- `hive://posts/{author}/{permlink}` - Retrieve specific posts

### Tools

- `get_posts_by_tag` - Retrieve posts by tag and category (trending, hot, etc.)
- `get_posts_by_user` - Fetch posts from a specific user or their feed
- `get_account_history` - Get transaction history for an account
- `vote_on_post` - Vote on Hive content (requires authentication)
- `create_post` - Create new blog posts on the Hive blockchain
- `create_comment` - Comment on existing posts or reply to comments
- `send_token` - Send HIVE or HBD cryptocurrency to other accounts
- `sign_message` - Sign a message using a Hive private key
- `verify_signature` - Verify a message signature against a Hive public key

## Installation

```bash
# Clone the repository
git clone https://github.com/gluneau/hive-mcp-server.git
cd hive-mcp-server

# Install dependencies
npm install
```

## Usage

### Basic Usage

```bash
# Start the server
npm start
```

### Debugging with MCP Inspector

The MCP Inspector provides an interactive interface for testing and debugging the server:

```bash
npm run inspector
```

### For Authentication (Voting)

To enable the voting functionality, you'll need to set two environment variables:

```bash
export HIVE_USERNAME=your-hive-username
export HIVE_POSTING_KEY=your-hive-posting-private-key
```

**Security Note**: Never share your private keys or commit them to version control. Use environment variables or a secure configuration approach.

## Integration with Claude Desktop

To use this server with Claude Desktop:

1. Ensure you have [Claude Desktop](https://claude.ai/download) installed
2. Open or create the Claude configuration file:
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`

3. Add this server to your configuration:

```json
{
  "mcpServers": {
    "hive": {
      "command": "npx",
      "args": [
        "ts-node",
        "/absolute/path/to/hive-mcp-server/src/hive-server.ts"
      ],
      "env": {
        "HIVE_USERNAME": "your-hive-username",
        "HIVE_POSTING_KEY": "your-hive-posting-private-key",
        "HIVE_ACTIVE_KEY": "your-hive-active-private-key",
        "HIVE_MEMO_KEY": "your-hive-memo-private-key"
      }
    }
  }
}
```

For Windows, use backslashes: `"C:\\absolute\\path\\to\\hive-mcp-server\\src\\hive-server.ts"`

4. Restart Claude Desktop

## Examples

Once connected to Claude Desktop or another MCP client, you can ask questions like:

- "What are the trending posts in the #photography tag on Hive?"
- "Show me the recent posts from username 'alice'"
- "What's the account balance and details for 'bob'?"
- "Get the transaction history for 'charlie'"
- "Can you upvote the post by 'dave' with permlink 'my-awesome-post'?"

## Development

### Project Structure

- `src/hive-server.ts` - Main server implementation

### Dependencies

- [@hiveio/dhive](https://www.npmjs.com/package/@hiveio/dhive) - Hive blockchain client
- [@modelcontextprotocol/sdk](https://www.npmjs.com/package/@modelcontextprotocol/sdk) - MCP SDK
- [zod](https://www.npmjs.com/package/zod) - Schema validation

## License

ISC

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

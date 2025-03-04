# Contributing to Hive MCP Server

Thank you for your interest in contributing to the Hive MCP Server! This document provides guidelines and instructions for contributing to this project.

## Code of Conduct

Please be respectful and considerate of others when contributing to this project. We strive to maintain a welcoming and inclusive environment for everyone.

## Getting Started

1. Fork the repository on GitHub
2. Clone your fork locally
3. Install dependencies with `npm install`
4. Create a new branch for your changes
5. Make your changes
6. Test your changes using the MCP Inspector (`npm run inspector`)
7. Commit and push your changes to your fork
8. Submit a pull request

## Development Guidelines

### Coding Standards

- Use TypeScript for all new code
- Follow the existing code style in the repository
- Use meaningful variable and function names
- Add comments for complex logic

### MCP Best Practices

- Follow the [Model Context Protocol specification](https://modelcontextprotocol.io/docs/concepts/architecture)
- Use appropriate error handling in all tools and resources
- Include proper input validation using Zod schemas
- Provide clear and helpful error messages

### Testing

- Test all new features manually using the MCP Inspector
- Ensure your changes don't break existing functionality

### Pull Requests

- Keep pull requests focused on a single change
- Provide a clear description of the changes and their purpose
- Reference any related issues
- Update documentation as needed

### Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) format:

```
feat: add new tool for finding posts by keyword
fix: correct error handling in account history tool
docs: update README with new examples
test: add tests for voting functionality
```

## Adding New Features

### New Tools

When adding a new tool:

1. Define a descriptive name and purpose
2. Create a Zod schema for input validation
3. Implement the core functionality
4. Handle errors appropriately
5. Update documentation to reflect the new tool

### New Resources

When adding a new resource:

1. Define a clear URI template
2. Implement the resource handler
3. Ensure proper error handling
4. Document the new resource in the README

## License

By contributing to this project, you agree that your contributions will be licensed under the project's ISC license.

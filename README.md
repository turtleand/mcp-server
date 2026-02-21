# @turtleand/mcp-server

A knowledge-base MCP server exposing Turtleand's published articles on AI integration, workflows, and career transition.

## What is this?

A personal MCP server. It gives Claude (or any MCP client) read-only access to 51 articles across 4 sites. No API keys, no credentials, no tools that execute anything. It just searches and retrieves text.

## What's inside

Content from four sites, bundled into a single index:

| Source | URL | Articles |
|--------|-----|----------|
| AI Lab | [lab.turtleand.com](https://lab.turtleand.com) | 11 |
| Blog | [growth.turtleand.com](https://growth.turtleand.com) | 27 |
| OpenClaw Lab | [openclaw.turtleand.com](https://openclaw.turtleand.com) | 9 |
| Build Log | [build.turtleand.com](https://build.turtleand.com) | 4 |

Topics include: running AI agents on cloud servers, prompt engineering, model selection, voice workflows, MCP development, and building in public.

## Quick start

```bash
git clone https://github.com/turtleand/mcp-server.git
cd mcp-server
npm install
npm run build
```

### Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "turtleand": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-server/dist/index.js"]
    }
  }
}
```

### Claude Code

```bash
claude mcp add turtleand node /absolute/path/to/mcp-server/dist/index.js
```

## Available tools

### `search-articles`

Takes a query string, returns the top 5 matching articles with title, summary, source, and URL.

Things you might ask Claude that would trigger it:

- "What has Turtleand written about prompt engineering?"
- "Find articles about running AI agents on servers"
- "Search for MCP-related content"

### `get-article`

Takes an article slug, returns the full text. Usually called after `search-articles` finds something relevant.

- "Show me the full article on safety baseline"
- "Get the persistent agents article"

## How it works

The content index is bundled in the package at build time. When the server starts, it loads the index into memory. No network calls, no API keys, fully self-contained.

The client's LLM decides when to call these tools based on the conversation. You don't need to do anything special.

## Running smoke tests

```bash
npm run build
node tests/smoke-test.mjs
```

Runs 5 checks: initialization, tool listing, search, valid article retrieval, and invalid slug handling.

## License

MIT

## Links

- [turtleand.com](https://turtleand.com)
- [lab.turtleand.com](https://lab.turtleand.com)
- [github.com/turtleand](https://github.com/turtleand)

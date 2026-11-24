---
nx: patch
---

New workspaces get a `.mcp.json` that connects agents to the `openpurpose` MCP server, with the agent token read from the `OPENPURPOSE_TOKEN` environment variable so it stays out of git. `sync` adds the file to older workspaces, and adds the `openpurpose` server to an existing `.mcp.json` while keeping the servers already in it.

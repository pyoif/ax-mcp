# ax-mcp Design Spec

## Overview
MCP server wrapping the `ax` CLI tool. Provides three grouped tools for HTTP fetch, page discovery, and CSS-based extraction.

## Architecture
Single-process MCP server using `@modelcontextprotocol/sdk` with stdio transport. Calls `ax` as a subprocess via `child_process.execFile`. No state between calls.

## Tools

### ax_fetch
HTTP requests with curl-like flexibility.
- **Params:** url, method, headers, body, bodyFile, insecure, followRedirects, bodyOnly, maxBytes, timeout
- **Returns:** Raw ax output (status, headers, body)

### ax_discover
Page structure discovery with three modes.
- **Params:** url, mode (outline|locate|count), selector, text, fresh, noCache
- **Returns:** Raw ax output (tag.class counts, selector matches)

### ax_extract
CSS-based data extraction with six modes.
- **Params:** url, selector, mode (rows|table|attr|text|html|markdown), row, attr, where, json, limit, all, budget, fresh, noCache
- **Returns:** Raw ax output (TSV or JSON depending on flags)

## Output
Raw stdout + stderr from ax, passed through as MCP text content. No parsing or transformation.

## Error Handling
Always return ax output regardless of exit code. ax reports HTTP status in stdout; non-zero exits are informational only.

## Dependencies
- `@modelcontextprotocol/sdk` — MCP protocol
- `zod` — param validation
- `ax` — peer dependency (user must install)
- `typescript`, `@types/node` — dev only

## File Structure
```
src/index.ts     — MCP server + 3 tools
tsconfig.json    — ES2022, Node16 module
package.json     — bin: ax-mcp, type: module
```

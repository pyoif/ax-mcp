# ax-mcp

MCP server for [ax](https://ax.yusuke.run) — the AI-era curl.

## Prerequisites

Install `ax` CLI:

```sh
curl -fsSL https://ax.yusuke.run/install | sh
```

## Install

```sh
pnpm add ax-mcp
```

## Usage

Add to your MCP client config (e.g. `~/.config/claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "ax": {
      "command": "ax-mcp"
    }
  }
}
```

## Tools

### `ax_fetch`

Fetch a URL — HTTP requests with curl-like flexibility.

| Param | Type | Description |
|-------|------|-------------|
| `url` | string | URL, file path, or `-` for stdin |
| `method` | string | HTTP method (GET, POST, PUT, PATCH, DELETE, HEAD) |
| `headers` | object | Request headers |
| `body` | string | Request body |
| `bodyFile` | string | Read body from file |
| `insecure` | boolean | Allow insecure TLS (-k) |
| `followRedirects` | boolean | Follow redirects (-L) |
| `bodyOnly` | boolean | Body only, uncapped (--body) |
| `maxBytes` | number | Max response bytes |
| `timeout` | number | Timeout in seconds |

### `ax_discover`

Discover page structure.

| Param | Type | Description |
|-------|------|-------------|
| `url` | string | URL to discover |
| `mode` | string | `outline`, `locate`, or `count` |
| `selector` | string | CSS selector (count mode) |
| `text` | string | Text to find (locate mode) |
| `fresh` | boolean | Force refetch |
| `noCache` | boolean | Skip disk cache |

### `ax_extract`

Extract data using CSS selectors.

| Param | Type | Description |
|-------|------|-------------|
| `url` | string | URL to extract from |
| `selector` | string | CSS selector |
| `mode` | string | `rows`, `table`, `attr`, `text`, `html`, `markdown` |
| `row` | string | Row mapping (rows mode): `field=sel, field2=sel2@attr` |
| `attr` | string | Attribute name (attr mode) |
| `where` | string | Filter expression (rows mode) |
| `json` | boolean | Output JSON instead of TSV |
| `limit` | number | Max results |
| `all` | boolean | Return all results |
| `budget` | number | Token budget |

## Development

```sh
pnpm install
pnpm build
pnpm test
```

## License

MIT

# ax-mcp

MCP server for [ax](https://github.com/yusukebe/ax) — the AI-era curl.

## Prerequisites

Install `ax` CLI:

```sh
curl -fsSL https://ax.yusuke.run/install | sh
```

## Usage

### Run directly

```sh
npx -y github:pyoif/ax-mcp
bunx ax-mcp
```

### Add to MCP client config

Example for `~/.config/claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "ax": {
      "command": "npx",
      "args": ["-y", "github:pyoif/ax-mcp"]
    }
  }
}
```

Or with bun:

```json
{
  "mcpServers": {
    "ax": {
      "command": "bunx",
      "args": ["ax-mcp"]
    }
  }
}
```

## Tools

### `fetch`

Fetch a URL — HTTP requests with curl-like flexibility.

| Param            | Type    | Description                                    |
| ---------------- | ------- | ---------------------------------------------- |
| `url`            | string  | URL, file path, or `-` for stdin               |
| `method`         | string  | HTTP method (GET, POST, PUT, PATCH, DELETE, HEAD) |
| `headers`        | object  | Request headers as key-value pairs             |
| `body`           | string  | Request body (strips CR/LF from @files)        |
| `bodyFile`       | string  | Read body from file                            |
| `dataRaw`        | string  | Request body literal (never reads @ as file)   |
| `dataBinary`     | string  | Request body (preserves CR/LF from files)      |
| `user`           | string  | Basic auth user:pass (-u)                      |
| `head`           | boolean | Use HEAD method (-I)                           |
| `output`         | string  | Save response to file (-o)                     |
| `insecure`       | boolean | Allow insecure TLS (-k)                        |
| `followRedirects`| boolean | Follow redirects (-L)                          |
| `fail`           | boolean | Exit 22 on HTTP errors (-f)                    |
| `bodyOnly`       | boolean | Body only, uncapped (--body)                   |
| `showAllHeaders` | boolean | Show all response headers (--headers)          |
| `maxBytes`       | number  | Max response bytes (default: 20MB)             |
| `timeout`        | number  | Timeout in seconds (default: 30)               |

### `discover`

Discover page structure.

| Param     | Type    | Description                                 |
| --------- | ------- | ------------------------------------------- |
| `url`     | string  | URL to discover                             |
| `mode`    | string  | `outline`, `locate`, or `count`             |
| `selector`| string  | CSS selector (count mode)                   |
| `text`    | string  | Text to find (locate mode)                  |
| `fresh`   | boolean | Force refetch                               |
| `noCache` | boolean | Skip disk cache                             |
| `limit`   | number  | Max results                                 |
| `all`     | boolean | Return all results                          |
| `budget`  | number  | Token budget                                |

### `extract`

Extract data using CSS selectors.

| Param     | Type    | Description                                 |
| --------- | ------- | ------------------------------------------- |
| `url`     | string  | URL to extract from                         |
| `selector`| string  | CSS selector                                |
| `mode`    | string  | `rows`, `table`, `attr`, `text`, `html`, `markdown` |
| `row`     | string  | Row mapping (rows mode): `field=sel, field2=sel2@attr` |
| `attr`    | string  | Attribute name (attr mode)                  |
| `where`   | string  | Filter expression (rows mode)               |
| `json`    | boolean | Output JSON instead of TSV                  |
| `limit`   | number  | Max results                                 |
| `all`     | boolean | Return all results                          |
| `budget`  | number  | Token budget                                |
| `fresh`   | boolean | Force refetch                               |
| `noCache` | boolean | Skip disk cache                             |

## License

GPL-3.0

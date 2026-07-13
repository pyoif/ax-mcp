#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerTools } from "./tools/index.js";

export { runAx } from "./ax.js";

export function createServer(): McpServer {
  const server = new McpServer({ name: "ax", version: "1.0.0" });
  registerTools(server);
  return server;
}

// Only run server when executed directly (not imported for tests)
const isMain = process.argv[1]?.endsWith("index.ts") || process.argv[1]?.endsWith("index.js");
if (isMain) {
  const transport = new StdioServerTransport();
  const server = createServer();
  await server.connect(transport);
}

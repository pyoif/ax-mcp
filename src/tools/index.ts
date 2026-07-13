import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerFetch } from "./fetch.js";
import { registerDiscover } from "./discover.js";
import { registerExtract } from "./extract.js";

export function registerTools(server: McpServer) {
  registerFetch(server);
  registerDiscover(server);
  registerExtract(server);
}

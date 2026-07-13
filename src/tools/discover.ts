import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { runAx } from "../ax.js";

export function registerDiscover(server: McpServer) {
  server.registerTool("discover", {
    description: "Discover page structure: outline (tag.class counts), locate (find text selector), or count (test selector matches).",
    inputSchema: {
      url: z.string().describe("URL to discover"),
      mode: z.enum(["outline", "locate", "count"]).describe("Discovery mode"),
      selector: z.string().optional().describe("CSS selector (for count mode)"),
      text: z.string().optional().describe("Text to find (for locate mode)"),
      fresh: z.boolean().optional().describe("Force refetch (ignore cache)"),
      noCache: z.boolean().optional().describe("Never use disk cache"),
    },
  }, async (params) => {
    const args = [params.url];
    if (params.mode === "outline") args.push("--outline");
    else if (params.mode === "locate") args.push("--locate", params.text ?? "");
    else if (params.mode === "count") args.push(params.selector ?? "", "--count");
    if (params.fresh) args.push("--fresh");
    if (params.noCache) args.push("--no-cache");
    const { stdout, stderr } = await runAx(args);
    return {
      content: [
        { type: "text" as const, text: stdout },
        ...(stderr ? [{ type: "text" as const, text: `\n--- stderr ---\n${stderr}` }] : []),
      ],
    };
  });
}

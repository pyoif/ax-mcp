import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { runAx } from "../ax.js";

export function registerFetch(server: McpServer) {
  server.registerTool("fetch", {
    description: "Fetch a URL and return structured HTTP response (status, headers, body). Supports all HTTP methods.",
    inputSchema: {
      url: z.string().describe("URL or file path or - for stdin"),
      method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD"]).optional().describe("HTTP method (default: GET)"),
      headers: z.object({}).catchall(z.string()).optional().describe("Request headers as key-value pairs"),
      body: z.string().optional().describe("Request body string"),
      bodyFile: z.string().optional().describe("Read request body from file"),
      dataRaw: z.string().optional().describe("Request body literal (never reads @ as file)"),
      dataBinary: z.string().optional().describe("Request body (preserves CR/LF from files)"),
      user: z.string().optional().describe("Basic auth user:pass (-u)"),
      head: z.boolean().optional().describe("Use HEAD method (-I)"),
      output: z.string().optional().describe("Save response to file (-o)"),
      insecure: z.boolean().optional().describe("Allow insecure TLS connections (-k)"),
      followRedirects: z.boolean().optional().describe("Follow redirects (-L)"),
      fail: z.boolean().optional().describe("Exit 22 on HTTP errors (-f)"),
      bodyOnly: z.boolean().optional().describe("Print body only, uncapped (--body)"),
      showAllHeaders: z.boolean().optional().describe("Show all response headers (--headers)"),
      maxBytes: z.number().optional().describe("Max response bytes (default: 20MB)"),
      timeout: z.number().optional().describe("Request timeout in seconds (default: 30)"),
    },
  }, async (params) => {
    const args: string[] = [params.url];
    if (params.method) args.push("-X", params.method);
    if (params.head) args.push("-I");
    if (params.headers) {
      for (const [k, v] of Object.entries(params.headers)) {
        args.push("-H", `${k}: ${v}`);
      }
    }
    if (params.user) args.push("-u", params.user);
    if (params.body) args.push("-d", params.body);
    if (params.bodyFile) args.push("-d", `@${params.bodyFile}`);
    if (params.dataRaw) args.push("--data-raw", params.dataRaw);
    if (params.dataBinary) args.push("--data-binary", params.dataBinary);
    if (params.output) args.push("-o", params.output);
    if (params.maxBytes) args.push("--max-bytes", String(params.maxBytes));
    if (params.timeout) args.push("-m", String(params.timeout));
    if (params.insecure) args.push("-k");
    if (params.followRedirects) args.push("-L");
    if (params.fail) args.push("-f");
    if (params.bodyOnly) args.push("--body");
    if (params.showAllHeaders) args.push("--headers");
    const { stdout, stderr } = await runAx(args);
    return {
      content: [
        { type: "text" as const, text: stdout },
        ...(stderr ? [{ type: "text" as const, text: `\n--- stderr ---\n${stderr}` }] : []),
      ],
    };
  });
}

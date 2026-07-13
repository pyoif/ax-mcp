import { z } from "zod";
import { runAx } from "../ax.js";
export function registerFetch(server) {
    server.registerTool("fetch", {
        description: "Fetch a URL and return structured HTTP response (status, headers, body). Supports all HTTP methods.",
        inputSchema: {
            url: z.string().describe("URL or file path or - for stdin"),
            method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD"]).optional().describe("HTTP method (default: GET)"),
            headers: z.object({}).catchall(z.string()).optional().describe("Request headers as key-value pairs"),
            body: z.string().optional().describe("Request body string"),
            bodyFile: z.string().optional().describe("Read request body from file"),
            maxBytes: z.number().optional().describe("Max response bytes (default: 20MB)"),
            timeout: z.number().optional().describe("Request timeout in seconds (default: 30)"),
            insecure: z.boolean().optional().describe("Allow insecure TLS connections (-k)"),
            followRedirects: z.boolean().optional().describe("Follow redirects (-L)"),
            bodyOnly: z.boolean().optional().describe("Print body only, uncapped (--body)"),
        },
    }, async (params) => {
        const args = [params.url];
        if (params.method)
            args.push("-X", params.method);
        if (params.headers) {
            for (const [k, v] of Object.entries(params.headers)) {
                args.push("-H", `${k}: ${v}`);
            }
        }
        if (params.body)
            args.push("-d", params.body);
        if (params.bodyFile)
            args.push("-d", `@${params.bodyFile}`);
        if (params.maxBytes)
            args.push("--max-bytes", String(params.maxBytes));
        if (params.timeout)
            args.push("-m", String(params.timeout));
        if (params.insecure)
            args.push("-k");
        if (params.followRedirects)
            args.push("-L");
        if (params.bodyOnly)
            args.push("--body");
        const { stdout, stderr } = await runAx(args);
        return {
            content: [
                { type: "text", text: stdout },
                ...(stderr ? [{ type: "text", text: `\n--- stderr ---\n${stderr}` }] : []),
            ],
        };
    });
}

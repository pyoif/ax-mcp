import { z } from "zod";
import { runAx } from "../ax.js";
export function registerExtract(server) {
    server.registerTool("extract", {
        description: "Extract data from a page using CSS selectors. Modes: rows, table, attr, text, html, markdown.",
        inputSchema: {
            url: z.string().describe("URL to extract from"),
            selector: z.string().describe("CSS selector"),
            mode: z.enum(["rows", "table", "attr", "text", "html", "markdown"]).describe("Extraction mode"),
            row: z.string().optional().describe("Row mapping for rows mode: 'field=sel, field2=sel2@attr'"),
            attr: z.string().optional().describe("Attribute name for attr mode (e.g. 'href')"),
            where: z.string().optional().describe("Filter expression for rows mode"),
            json: z.boolean().optional().describe("Output JSON instead of TSV"),
            limit: z.number().optional().describe("Max results"),
            all: z.boolean().optional().describe("Return all results (no limit)"),
            budget: z.number().optional().describe("Token budget for output"),
            fresh: z.boolean().optional().describe("Force refetch"),
            noCache: z.boolean().optional().describe("Never use disk cache"),
        },
    }, async (params) => {
        const args = [params.url, params.selector];
        if (params.mode === "rows") {
            args.push("--row", params.row ?? "");
            if (params.where)
                args.push("--where", params.where);
        }
        else if (params.mode === "table") {
            args.push("--table");
        }
        else if (params.mode === "attr") {
            args.push("--attr", params.attr ?? "");
        }
        else if (params.mode === "text") {
            args.push("--text");
        }
        else if (params.mode === "html") {
            args.push("--html");
        }
        else if (params.mode === "markdown") {
            args.push("--md");
        }
        if (params.json)
            args.push("--json");
        if (params.limit)
            args.push("--limit", String(params.limit));
        if (params.all)
            args.push("--all");
        if (params.budget)
            args.push("--budget", String(params.budget));
        if (params.fresh)
            args.push("--fresh");
        if (params.noCache)
            args.push("--no-cache");
        const { stdout, stderr } = await runAx(args);
        return {
            content: [
                { type: "text", text: stdout },
                ...(stderr ? [{ type: "text", text: `\n--- stderr ---\n${stderr}` }] : []),
            ],
        };
    });
}

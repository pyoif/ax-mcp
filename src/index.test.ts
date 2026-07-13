import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";

// Mock child_process.execFile
vi.mock("node:child_process", () => ({
  execFile: vi.fn(),
}));

import { execFile } from "node:child_process";
const mockExecFile = vi.mocked(execFile);

// Import after mock setup
const { runAx, createServer } = await import("./index.ts");

describe("runAx", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns stdout and stderr on success", async () => {
    mockExecFile.mockImplementation((_cmd, _args, _opts, cb) => {
      cb!(null, { stdout: "ok", stderr: "" });
      return {} as any;
    });

    const result = await runAx(["https://example.com"]);
    expect(result.stdout).toBe("ok");
    expect(result.stderr).toBe("");
  });

  it("returns stdout on non-zero exit (HTTP error)", async () => {
    const err = new Error("exit 22") as any;
    err.stdout = '{"status":404}';
    err.stderr = "";
    mockExecFile.mockImplementation((_cmd, _args, _opts, cb) => {
      cb!(err, null);
      return {} as any;
    });

    const result = await runAx(["https://example.com/404"]);
    expect(result.stdout).toBe('{"status":404}');
  });

  it("throws on real errors (no stdout)", async () => {
    mockExecFile.mockImplementation((_cmd, _args, _opts, cb) => {
      cb!(new Error("ax not found"), null);
      return {} as any;
    });

    await expect(runAx(["https://example.com"])).rejects.toThrow("ax not found");
  });
});

describe("MCP tools", () => {
  let client: Client;
  let server: McpServer;

  beforeEach(async () => {
    vi.clearAllMocks();
    server = createServer();
    client = new Client({ name: "test", version: "0.0.0" });

    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await server.connect(serverTransport);
    await client.connect(clientTransport);
  });

  afterEach(async () => {
    await client.close();
    await server.close();
  });

  it("lists 3 tools", async () => {
    const { tools } = await client.listTools();
    expect(tools).toHaveLength(3);
    expect(tools.map((t) => t.name).sort()).toEqual([
      "discover",
      "extract",
      "fetch",
    ]);
  });

  describe("fetch", () => {
    it("calls ax with url", async () => {
      mockExecFile.mockImplementation((_cmd, _args, _opts, cb) => {
        cb!(null, { stdout: '{"status":200}', stderr: "" });
        return {} as any;
      });

      const result = await client.callTool({
        name: "fetch",
        arguments: { url: "https://example.com" },
      });

      expect(mockExecFile).toHaveBeenCalledWith(
        "ax",
        ["https://example.com"],
        expect.any(Object),
        expect.any(Function)
      );
      expect(result.content).toEqual([
        { type: "text", text: '{"status":200}' },
      ]);
    });

    it("passes method, headers, body options", async () => {
      mockExecFile.mockImplementation((_cmd, _args, _opts, cb) => {
        cb!(null, { stdout: "ok", stderr: "" });
        return {} as any;
      });

      await client.callTool({
        name: "fetch",
        arguments: {
          url: "https://api.example.com",
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: '{"key":"value"}',
          insecure: true,
        },
      });

      expect(mockExecFile).toHaveBeenCalledWith(
        "ax",
        [
          "https://api.example.com",
          "-X", "POST",
          "-H", "Content-Type: application/json",
          "-d", '{"key":"value"}',
          "-k",
        ],
        expect.any(Object),
        expect.any(Function)
      );
    });

    it("includes stderr when present", async () => {
      mockExecFile.mockImplementation((_cmd, _args, _opts, cb) => {
        cb!(null, { stdout: "body", stderr: "warn: capped" });
        return {} as any;
      });

      const result = await client.callTool({
        name: "fetch",
        arguments: { url: "https://example.com" },
      });

      expect(result.content).toHaveLength(2);
      expect(result.content[1].text).toContain("warn: capped");
    });
  });

  describe("discover", () => {
    it("outline mode", async () => {
      mockExecFile.mockImplementation((_cmd, _args, _opts, cb) => {
        cb!(null, { stdout: "div.card  12", stderr: "" });
        return {} as any;
      });

      const result = await client.callTool({
        name: "discover",
        arguments: { url: "https://example.com", mode: "outline" },
      });

      expect(mockExecFile).toHaveBeenCalledWith(
        "ax",
        ["https://example.com", "--outline"],
        expect.any(Object),
        expect.any(Function)
      );
      expect(result.content[0].text).toBe("div.card  12");
    });

    it("locate mode with text", async () => {
      mockExecFile.mockImplementation((_cmd, _args, _opts, cb) => {
        cb!(null, { stdout: "h1.title", stderr: "" });
        return {} as any;
      });

      await client.callTool({
        name: "discover",
        arguments: { url: "https://example.com", mode: "locate", text: "Welcome" },
      });

      expect(mockExecFile).toHaveBeenCalledWith(
        "ax",
        ["https://example.com", "--locate", "Welcome"],
        expect.any(Object),
        expect.any(Function)
      );
    });

    it("count mode with selector", async () => {
      mockExecFile.mockImplementation((_cmd, _args, _opts, cb) => {
        cb!(null, { stdout: "5 matches", stderr: "" });
        return {} as any;
      });

      await client.callTool({
        name: "discover",
        arguments: { url: "https://example.com", mode: "count", selector: ".item" },
      });

      expect(mockExecFile).toHaveBeenCalledWith(
        "ax",
        ["https://example.com", ".item", "--count"],
        expect.any(Object),
        expect.any(Function)
      );
    });
  });

  describe("extract", () => {
    it("rows mode with row mapping", async () => {
      mockExecFile.mockImplementation((_cmd, _args, _opts, cb) => {
        cb!(null, { stdout: "title\tprice\nWidget\t9.99", stderr: "2 rows extracted" });
        return {} as any;
      });

      const result = await client.callTool({
        name: "extract",
        arguments: {
          url: "https://shop.example.com",
          selector: ".product",
          mode: "rows",
          row: "title=h2, price=.price",
        },
      });

      expect(mockExecFile).toHaveBeenCalledWith(
        "ax",
        ["https://shop.example.com", ".product", "--row", "title=h2, price=.price"],
        expect.any(Object),
        expect.any(Function)
      );
      expect(result.content[0].text).toContain("title\tprice");
    });

    it("table mode", async () => {
      mockExecFile.mockImplementation((_cmd, _args, _opts, cb) => {
        cb!(null, { stdout: "Name\tValue\nA\t1", stderr: "" });
        return {} as any;
      });

      await client.callTool({
        name: "extract",
        arguments: {
          url: "https://example.com/data",
          selector: "table",
          mode: "table",
        },
      });

      expect(mockExecFile).toHaveBeenCalledWith(
        "ax",
        ["https://example.com/data", "table", "--table"],
        expect.any(Object),
        expect.any(Function)
      );
    });

    it("attr mode", async () => {
      mockExecFile.mockImplementation((_cmd, _args, _opts, cb) => {
        cb!(null, { stdout: "/about\n/contact", stderr: "" });
        return {} as any;
      });

      await client.callTool({
        name: "extract",
        arguments: {
          url: "https://example.com",
          selector: "a",
          mode: "attr",
          attr: "href",
        },
      });

      expect(mockExecFile).toHaveBeenCalledWith(
        "ax",
        ["https://example.com", "a", "--attr", "href"],
        expect.any(Object),
        expect.any(Function)
      );
    });

    it("text mode", async () => {
      mockExecFile.mockImplementation((_cmd, _args, _opts, cb) => {
        cb!(null, { stdout: "Hello World", stderr: "" });
        return {} as any;
      });

      await client.callTool({
        name: "extract",
        arguments: { url: "https://example.com", selector: "h1", mode: "text" },
      });

      expect(mockExecFile).toHaveBeenCalledWith(
        "ax",
        ["https://example.com", "h1", "--text"],
        expect.any(Object),
        expect.any(Function)
      );
    });

    it("html mode", async () => {
      mockExecFile.mockImplementation((_cmd, _args, _opts, cb) => {
        cb!(null, { stdout: '<span class="name">Test</span>', stderr: "" });
        return {} as any;
      });

      await client.callTool({
        name: "extract",
        arguments: { url: "https://example.com", selector: ".card", mode: "html" },
      });

      expect(mockExecFile).toHaveBeenCalledWith(
        "ax",
        ["https://example.com", ".card", "--html"],
        expect.any(Object),
        expect.any(Function)
      );
    });

    it("markdown mode", async () => {
      mockExecFile.mockImplementation((_cmd, _args, _opts, cb) => {
        cb!(null, { stdout: "# Title\n\nContent here", stderr: "" });
        return {} as any;
      });

      await client.callTool({
        name: "extract",
        arguments: { url: "https://example.com", selector: "body", mode: "markdown" },
      });

      expect(mockExecFile).toHaveBeenCalledWith(
        "ax",
        ["https://example.com", "body", "--md"],
        expect.any(Object),
        expect.any(Function)
      );
    });

    it("passes where filter", async () => {
      mockExecFile.mockImplementation((_cmd, _args, _opts, cb) => {
        cb!(null, { stdout: "Expensive\t99.99", stderr: "" });
        return {} as any;
      });

      await client.callTool({
        name: "extract",
        arguments: {
          url: "https://shop.example.com",
          selector: ".item",
          mode: "rows",
          row: "name=h2, price=.price",
          where: "price > 50",
        },
      });

      expect(mockExecFile).toHaveBeenCalledWith(
        "ax",
        ["https://shop.example.com", ".item", "--row", "name=h2, price=.price", "--where", "price > 50"],
        expect.any(Object),
        expect.any(Function)
      );
    });

    it("passes json flag", async () => {
      mockExecFile.mockImplementation((_cmd, _args, _opts, cb) => {
        cb!(null, { stdout: '[{"name":"A"}]', stderr: "" });
        return {} as any;
      });

      await client.callTool({
        name: "extract",
        arguments: {
          url: "https://example.com",
          selector: ".item",
          mode: "rows",
          row: "name=h2",
          json: true,
        },
      });

      expect(mockExecFile).toHaveBeenCalledWith(
        "ax",
        ["https://example.com", ".item", "--row", "name=h2", "--json"],
        expect.any(Object),
        expect.any(Function)
      );
    });
  });
});

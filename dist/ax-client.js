import { parseHTML } from "linkedom";
// --- Fetch ---
export async function axFetch(url, opts = {}) {
    const maxBytes = opts.maxBytes ?? 20 * 1024 * 1024;
    const timeoutMs = opts.timeoutMs ?? 30_000;
    const method = opts.method?.toUpperCase() ?? "GET";
    const started = performance.now();
    const res = await fetch(url, {
        method,
        headers: opts.headers,
        body: opts.body,
        signal: AbortSignal.timeout(timeoutMs),
        ...(opts.insecure ? { tls: { rejectUnauthorized: false } } : {}),
    });
    const ms = Math.round(performance.now() - started);
    const contentType = res.headers.get("content-type");
    const buffer = await res.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const truncated = bytes.length > maxBytes;
    const bodyBytes = truncated ? bytes.slice(0, maxBytes) : bytes;
    const body = new TextDecoder().decode(bodyBytes);
    const headers = {};
    res.headers.forEach((v, k) => { headers[k] = v; });
    return { status: res.status, ok: res.ok, ms, headers, body };
}
// --- Parse HTML ---
export function parseUrl(html) {
    return parseHTML(html);
}
// --- Outline: tag.class counts ---
export function outline(document) {
    const counts = new Map();
    for (const el of document.querySelectorAll("*")) {
        const sig = signature(el);
        counts.set(sig, (counts.get(sig) ?? 0) + 1);
    }
    return [...counts.entries()]
        .filter(([, n]) => n >= 2)
        .sort((a, b) => b[1] - a[1])
        .map(([sig, n]) => `${String(n).padStart(5)}  ${sig}`);
}
function signature(el) {
    const classes = [...el.classList];
    return el.localName + (classes.length ? "." + classes.join(".") : "");
}
function selectorPath(el) {
    const parts = [];
    let node = el;
    while (node && node.localName !== "body" && node.localName !== "html") {
        parts.unshift(node.id ? `${node.localName}#${node.id}` : signature(node));
        node = node.parentElement;
    }
    return parts.join(" > ");
}
export function locate(document, needle) {
    const lower = needle.toLowerCase();
    const hits = [];
    for (const el of document.querySelectorAll("*")) {
        const attrHit = el
            .getAttributeNames()
            .map((n) => [n, el.getAttribute(n) ?? ""])
            .find(([, v]) => v.toLowerCase().includes(lower));
        const childHit = [...el.children].some((c) => (c.textContent ?? "").toLowerCase().includes(lower));
        const textHit = !childHit && (el.textContent ?? "").toLowerCase().includes(lower);
        if (!attrHit && !textHit)
            continue;
        const snippet = attrHit ? `${attrHit[0]}="${attrHit[1]}"` : collapse(el.textContent ?? "");
        hits.push({
            selector: selectorPath(el),
            match: snippet.length > 80 ? snippet.slice(0, 80) + "…" : snippet,
        });
    }
    return hits;
}
function collapse(s) {
    return s.trim().replace(/\s+/g, " ");
}
export function parseRowSpec(spec) {
    return spec.split(",").map((part) => {
        const [name, rest] = part.split("=");
        const [sel, attr] = (rest ?? "").split("@");
        return { name: name.trim(), sel: sel?.trim() ?? "", attr: attr?.trim() };
    });
}
export function extractRows(document, selector, fields) {
    const els = document.querySelectorAll(selector);
    return [...els].map((el) => {
        const obj = {};
        for (const f of fields) {
            const target = f.sel === "" ? el : el.querySelector(f.sel);
            if (!target)
                obj[f.name] = null;
            else if (f.attr)
                obj[f.name] = target.getAttribute(f.attr);
            else
                obj[f.name] = collapse(target.textContent ?? "");
        }
        return obj;
    });
}
export function extractTable(document, selector) {
    const tables = [...document.querySelectorAll(selector ?? "table")].filter((el) => el.localName === "table" || (el.querySelector("table") && el.localName !== "table"));
    const targets = tables.flatMap((el) => el.localName === "table" ? [el] : [...el.querySelectorAll("table")]);
    if (targets.length === 0)
        return { headers: [], rows: [] };
    const table = targets[0];
    const allRows = [...table.querySelectorAll("tr")].filter((tr) => tr.closest("table") === table);
    if (allRows.length === 0)
        return { headers: [], rows: [] };
    const cellsOf = (tr) => [...tr.children].filter((c) => c.localName === "th" || c.localName === "td");
    const grid = allRows.map(() => []);
    allRows.forEach((tr, r) => {
        let c = 0;
        for (const cell of cellsOf(tr)) {
            while (grid[r][c] !== undefined)
                c++;
            const text = collapse(cell.textContent ?? "");
            const cs = Math.max(1, Number(cell.getAttribute("colspan")) || 1);
            const rs = Math.max(1, Number(cell.getAttribute("rowspan")) || 1);
            for (let dr = 0; dr < rs && r + dr < allRows.length; dr++) {
                for (let dc = 0; dc < cs; dc++)
                    grid[r + dr][c + dc] = text;
            }
            c += cs;
        }
    });
    let headerRowCount = 0;
    while (headerRowCount < allRows.length &&
        cellsOf(allRows[headerRowCount]).every((c) => c.localName === "th") &&
        cellsOf(allRows[headerRowCount]).length > 0) {
        headerRowCount++;
    }
    const width = Math.max(...grid.map((row) => row.length));
    const named = Array.from({ length: width }, (_, i) => headerRowCount > 0 ? grid[0][i] || `col${i}` : `col${i}`);
    const seen = new Map();
    const headers = named.map((h) => {
        const n = (seen.get(h) ?? 0) + 1;
        seen.set(h, n);
        return n === 1 ? h : `${h}_${n}`;
    });
    const rows = grid
        .slice(headerRowCount)
        .map((cells) => Object.fromEntries(headers.map((h, i) => [h, cells[i] ?? null])))
        .filter((r) => Object.values(r).some((v) => v));
    return { headers, rows };
}
export function compileWhere(src) {
    // Simple expression parser for common patterns
    // Supports: field op value, field op value AND field op value
    const orParts = src.split(/\s+OR\s+/i);
    const predicates = orParts.map((orPart) => {
        const andParts = orPart.split(/\s+AND\s+/i);
        return andParts.map((part) => {
            const m = part.match(/^(\w+)\s*([><=!]+)\s*(.+)$/);
            if (!m)
                return () => true;
            const [, field, op, rawValue] = m;
            const value = rawValue.replace(/^["']|["']$/g, "");
            return (row) => {
                const v = Number(row[field]);
                const compared = Number(value);
                if (!isNaN(v) && !isNaN(compared)) {
                    switch (op) {
                        case ">": return v > compared;
                        case "<": return v < compared;
                        case ">=": return v >= compared;
                        case "<=": return v <= compared;
                        case "=":
                        case "==": return v === compared;
                        case "!=": return v !== compared;
                    }
                }
                const sv = String(row[field] ?? "");
                switch (op) {
                    case "=":
                    case "==": return sv === value;
                    case "!=": return sv !== value;
                    case ">": return sv > value;
                    case "<": return sv < value;
                    case ">=": return sv >= value;
                    case "<=": return sv <= value;
                    default: return true;
                }
            };
        });
    });
    return (row) => predicates.some((andPreds) => andPreds.every((p) => p(row)));
}
// --- Output helpers ---
export function toTsv(rows) {
    if (rows.length === 0)
        return [];
    const headers = Object.keys(rows[0]);
    const lines = [headers.join("\t")];
    for (const row of rows) {
        lines.push(headers.map((h) => String(row[h] ?? "")).join("\t"));
    }
    return lines;
}

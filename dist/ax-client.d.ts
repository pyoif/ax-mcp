export interface FetchResult {
    status: number;
    ok: boolean;
    ms: number;
    headers: Record<string, string>;
    body: string;
}
export interface FetchOptions {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
    maxBytes?: number;
    timeoutMs?: number;
    insecure?: boolean;
}
export declare function axFetch(url: string, opts?: FetchOptions): Promise<FetchResult>;
export declare function parseUrl(html: string): Window & typeof globalThis;
export declare function outline(document: ParentNode): string[];
export interface LocateHit {
    selector: string;
    match: string;
}
export declare function locate(document: ParentNode, needle: string): LocateHit[];
export interface Field {
    name: string;
    sel: string;
    attr?: string;
}
export declare function parseRowSpec(spec: string): Field[];
export declare function extractRows(document: ParentNode, selector: string, fields: Field[]): Record<string, string | null>[];
export interface TableResult {
    headers: string[];
    rows: Record<string, string | null>[];
}
export declare function extractTable(document: ParentNode, selector?: string): TableResult;
export type WherePredicate = (row: Record<string, unknown>) => boolean;
export declare function compileWhere(src: string): WherePredicate;
export declare function toTsv(rows: Record<string, unknown>[]): string[];

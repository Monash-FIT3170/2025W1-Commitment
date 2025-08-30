// src/lib/utils/csv.ts
export function sniffDelimiterFromText(text: string): "," | "\t" {
  const firstLine = text.split(/\r?\n/)[0] ?? "";
  const commas = (firstLine.match(/,/g) || []).length;
  const tabs   = (firstLine.match(/\t/g) || []).length;
  return tabs > commas ? "\t" : ",";
}

export function readHeaders(bytes: Uint8Array): { headers: string[]; delimiter: "," | "\t" } {
  // TextDecoder exists in Node and browsers; fine for SSR
  const text = new TextDecoder("utf-8").decode(bytes);
  const delimiter = sniffDelimiterFromText(text);
  const firstLine = text.split(/\r?\n/)[0] ?? "";
  const headers = firstLine.split(delimiter).map((h) => h.trim());
  return { headers, delimiter };
}

// Minimal required columns
const REQUIRED = ["Identifier", "Full name", "ID number", "Email address"];

export function validateHeaders(headers: string[]): { ok: boolean; missing: string[] } {
  const set = new Set(headers.map((h) => h.toLowerCase()));
  const missing = REQUIRED.filter((r) => !set.has(r.toLowerCase()));
  return { ok: missing.length === 0, missing };
}
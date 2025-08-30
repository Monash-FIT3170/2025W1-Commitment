// src/lib/utils/csv.ts
export type Delim = "," | "\t";

export function sniffDelimiter(text: string): Delim {
  const first = text.split(/\r?\n/)[0] ?? "";
  const commas = (first.match(/,/g) || []).length;
  const tabs = (first.match(/\t/g) || []).length;
  return tabs > commas ? "\t" : ",";
}

export function readHeaders(bytes: Uint8Array): { headers: string[]; delimiter: Delim } {
  const text = new TextDecoder().decode(bytes);
  const delimiter = sniffDelimiter(text);
  const firstLine = text.split(/\r?\n/)[0] ?? "";
  const headers = splitRow(firstLine, delimiter).map((h) => h.trim());
  return { headers, delimiter };
}

export function parseRows(bytes: Uint8Array): { headers: string[]; delimiter: Delim; rows: Record<string, string>[] } {
  const text = new TextDecoder().decode(bytes);
  const delimiter = sniffDelimiter(text);
  const lines = text.split(/\r?\n/).filter((l) => l.length > 0);
  if (lines.length === 0) return { headers: [], delimiter, rows: [] };

  const headers = splitRow(lines[0], delimiter);
  const rows = lines.slice(1).map((line) => {
    const cells = splitRow(line, delimiter);
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => (obj[h] = cells[i] ?? ""));
    return obj;
  });

  return { headers, delimiter, rows };
}

// Split a CSV/TSV line into cells, handling quotes for CSV.
function splitRow(line: string, delim: Delim): string[] {
  if (delim === "\t") {
    // TSV is simple
    return line.split("\t");
  }
  // CSV with quotes
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"'; i++; // escaped quote
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (ch === "," && !inQuotes) {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

// Basic schema validation for Moodle-style grading sheets
const REQUIRED = ["Email address"]; // minimum join key
export function validateHeaders(headers: string[]) {
  const set = new Set(headers);
  const missing = REQUIRED.filter((h) => !set.has(h));
  return { ok: missing.length === 0, missing };
}

// Nicely parse a number (grade) from a string cell
export function parseNumberCell(s: string | undefined): number | null {
  if (!s) return null;
  const x = Number(String(s).replace(/[^\d.+-]/g, ""));
  return Number.isFinite(x) ? x : null;
}

// Turn rows back into CSV/TSV text (preserves delimiter rules).
export function stringifyRows(
  headers: string[],
  rows: Record<string, string>[],
  delim: Delim
): string {
  const escape = (cell: string) => {
    const s = String(cell ?? "");
    if (delim === "\t") {
      // TSV: just avoid newlines
      return s.replace(/\r?\n/g, " ");
    }
    // CSV: quote if needed, escape inner quotes
    const needs = /[",\r\n]/.test(s);
    const q = s.replace(/"/g, '""');
    return needs ? `"${q}"` : q;
  };

  const headerLine = headers.map(escape).join(delim);
  const lines = rows.map((r) => headers.map((h) => escape(r[h] ?? "")).join(delim));
  return [headerLine, ...lines].join("\r\n");
}
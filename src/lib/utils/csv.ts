// src/lib/utils/csv.ts

export type Delim = "," | "\t";

/** Pick the most likely delimiter from the first line. */
export function sniff_delimiter(text: string): Delim {
    const first = text.split(/\r?\n/)[0] ?? "";
    const commas = (first.match(/,/g) || []).length;
    const tabs = (first.match(/\t/g) || []).length;
    return tabs > commas ? "\t" : ",";
}

/** Read only the header row and delimiter from raw bytes. */
export function read_headers(bytes: Uint8Array): {
    headers: string[];
    delimiter: Delim;
} {
    const text = new TextDecoder().decode(bytes);
    const delimiter = sniff_delimiter(text);
    const first_line = text.split(/\r?\n/)[0] ?? "";
    const headers = split_row(first_line, delimiter).map((h) => h.trim());
    return { headers, delimiter };
}

/** Parse the whole file into header list and array of row objects. */
export function parse_rows(bytes: Uint8Array): {
    headers: string[];
    delimiter: Delim;
    rows: Record<string, string>[];
} {
    const text = new TextDecoder().decode(bytes);
    const delimiter = sniff_delimiter(text);
    const lines = text.split(/\r?\n/).filter((l) => l.length > 0);
    if (lines.length === 0) return { headers: [], delimiter, rows: [] };

    const headers = split_row(lines[0], delimiter);
    const rows = lines.slice(1).map((line) => {
        const cells = split_row(line, delimiter);
        const obj: Record<string, string> = {};
        headers.forEach((h, i) => (obj[h] = cells[i] ?? ""));
        return obj;
    });

    return { headers, delimiter, rows };
}

/** Split a CSV/TSV line into cells, handling quotes for CSV. */
function split_row(line: string, delim: Delim): string[] {
    if (delim === "\t") {
        // TSV is simple
        return line.split("\t");
    }
    // CSV with quotes
    const out: string[] = [];
    let cur = "";
    let in_quotes = false;

    for (let i = 0; i < line.length; i++) {
        const ch = line[i];

        if (ch === '"') {
            if (in_quotes && line[i + 1] === '"') {
                cur += '"';
                i++; // escaped quote
            } else {
                in_quotes = !in_quotes;
            }
            continue;
        }

        if (ch === "," && !in_quotes) {
            out.push(cur);
            cur = "";
        } else {
            cur += ch;
        }
    }
    out.push(cur);
    return out.map((s) => s.trim());
}

/** Basic schema validation for Moodle-style grading sheets. */
const REQUIRED = ["Email address"]; // minimum join key
export function validate_headers(headers: string[]) {
    const set = new Set(headers);
    const missing = REQUIRED.filter((h) => !set.has(h));
    return { ok: missing.length === 0, missing };
}

/** Nicely parse a number (grade) from a string cell. */
export function parse_number_cell(s: string | undefined): number | null {
    if (!s) return null;
    const x = Number(String(s).replace(/[^\d.+-]/g, ""));
    return Number.isFinite(x) ? x : null;
}

/** Turn rows back into CSV/TSV text (preserves delimiter rules). */
export function stringify_rows(
    headers: string[],
    rows: Record<string, string>[],
    delim: Delim
): string {
    const escape = (cell: string) => {
        const val = String(cell ?? "");
        if (delim === "\t") {
            // TSV: just avoid newlines
            return val.replace(/\r?\n/g, " ");
        }
        // CSV: quote if needed, escape inner quotes
        const needs_quotes = /[",\r\n]/.test(val);
        const quoted = val.replace(/"/g, '""');
        return needs_quotes ? `"${quoted}"` : quoted;
    };

    const header_line = headers.map(escape).join(delim);
    const lines = rows.map((r) =>
        headers.map((h) => escape(r[h] ?? "")).join(delim)
    );
    return [header_line, ...lines].join("\r\n");
}

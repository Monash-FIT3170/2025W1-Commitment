// src/lib/utils/populate.ts
import type { Contributor } from "$lib/metrics";

const normaliseEmail = (e: string) => e.trim().toLowerCase();

/** Extract lowercased emails from a contributor.contacts field (string | string[]) */
export function emailsFromContacts(contacts: string | string[]): string[] {
  const arr = Array.isArray(contacts) ? contacts : [contacts];
  return arr
    .map((c) => String(c).trim())
    .filter((c) => c.includes("@"))
    .map(normaliseEmail);
}

/** Build a quick index: email -> contributor */
export function indexContributorsByEmail(contributors: Contributor[]): Map<string, Contributor> {
  const m = new Map<string, Contributor>();
  for (const c of contributors) {
    for (const e of emailsFromContacts(c.contacts as any)) {
      if (!m.has(e)) m.set(e, c);
    }
  }
  return m;
}

// Turn rows back into text, preserving header order and quoting values when needed
export function stringifyRows(
  headers: string[],
  rows: Record<string, string>[],
  delimiter: Delim
): string {
  const quoteIfNeeded = (val: string) => {
    // Ensure val is string
    let v = val ?? "";
    // Escape quotes
    if (v.includes('"')) v = v.replace(/"/g, '""');
    // Quote when it contains delimiter, quote, or newline
    if (v.includes(delimiter) || v.includes('"') || /\r|\n/.test(v)) {
      return `"${v}"`;
    }
    return v;
  };

  const headerLine = headers.map(quoteIfNeeded).join(delimiter);

  const body = rows
    .map((row) => headers.map((h) => quoteIfNeeded(row[h] ?? "")).join(delimiter))
    .join("\n");

  return `${headerLine}\n${body}`;
}
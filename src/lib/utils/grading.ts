// src/lib/utils/grading.ts
import type { Contributor } from "$lib/metrics";
import type { UploadedGradingFile } from "$lib/stores/gradingFile";

// -------- CSV helpers we rely on --------
import { stringifyRows } from "$lib/utils/csv";

// Runtime check for Tauri
const isTauri = typeof window !== "undefined" && !!(window as any).__TAURI__;

/**
 * Avoid Vite import-analysis: build the specifier at runtime
 * and use a Function wrapper so the string isn’t visible to the parser.
 */
// eslint-disable-next-line @typescript-eslint/no-implied-eval
const runtimeImport = (s: string) => new Function("s", "return import(s)")(s);

// ---------- Public API ----------

export function populateUploadedFile(opts: {
  contributors: Contributor[];
  uploaded: UploadedGradingFile | null;
  algorithm?: "commits"; // extend later
}): string {
  const { contributors, uploaded } = opts;
  // If no uploaded sheet, export a minimal CSV (fallback)
  if (!uploaded || !uploaded.headers?.length) {
    const headers = [
      "Email address",
      "Raw mark",
      "Scaling factor",
      "Scaled mark",
    ];
    const rows = contributors.map((c) => {
      const email = toPrimaryEmail(c.contacts);
      const raw = null;
      const factor = 1.0;
      const scaled = null;
      return {
        [headers[0]]: email ?? "",
        [headers[1]]: rawToCell(raw),
        [headers[2]]: factor.toFixed(2),
        [headers[3]]: scaledToCell(scaled),
      };
    });
    return stringifyRows(headers, rows, ",");
  }

  // Use the uploaded header order, appending our computed columns if missing
  const H = new Set(uploaded.headers);
  const appended = ["Raw mark", "Scaling factor", "Scaled mark"].filter(
    (h) => !H.has(h)
  );
  const headers = [...uploaded.headers, ...appended];

  // Build a lookup by email from uploaded rows if you parse them later
  // For now we only emit one row per contributor and keep any extra columns empty.
  const rows = contributors.map((c) => {
    const email = toPrimaryEmail(c.contacts) ?? "";
    const factor = 1.0; // TODO: replace with real factor from page later
    const raw: number | null = null;
    const scaled: number | null = null;

    const row: Record<string, string> = {};
    // start all uploaded columns empty; we don’t have original rows here yet
    for (const h of uploaded.headers) row[h] = "";

    row["Email address"] = email;
    row["Raw mark"] = rawToCell(raw);
    row["Scaling factor"] = factor.toFixed(2);
    row["Scaled mark"] = scaledToCell(scaled);

    return row;
  });

  return stringifyRows(headers, rows, uploaded.delimiter ?? ",");
}

export async function downloadTextFile(filename: string, text: string) {
  if (isTauri) {
    try {
      // Build specifiers at runtime (no literal in the AST)
      const dialogMod = await runtimeImport("@tauri-apps/api/dialog");
      const fsMod = await runtimeImport("@tauri-apps/plugin-fs");

      const ext = extOf(filename) || "csv";
      const dest: string | null = await dialogMod.save({
        defaultPath: filename,
        filters: [{ name: ext.toUpperCase(), extensions: [ext] }],
      });
      if (dest) {
        await fsMod.writeTextFile(dest, text);
      }
      return;
    } catch (e) {
      console.warn("[downloadTextFile] Tauri path failed, falling back:", e);
    }
  }

  // Browser fallback
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// ---------- Small helpers ----------
function extOf(name: string): string | null {
  const dot = name.lastIndexOf(".");
  return dot > -1 ? name.slice(dot + 1).toLowerCase() : null;
}

function toPrimaryEmail(contacts: Contributor["contacts"]): string | null {
  if (Array.isArray(contacts)) return contacts[0] ?? null;
  if (typeof contacts === "string") return contacts || null;
  return null;
}

function rawToCell(raw: number | null) {
  return raw == null ? "" : String(raw);
}

function scaledToCell(s: number | null) {
  return s == null ? "" : s.toFixed(2);
}
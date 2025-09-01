// src/lib/utils/grading.ts
import { info } from "@tauri-apps/plugin-log";
import type { Contributor } from "$lib/metrics";
import {
    get_average_commits,
    get_sd,
    calculate_scaling_factor,
} from "$lib/metrics";

import { parse_rows, stringify_rows, parse_number_cell } from "$lib/utils/csv";

import type { UploadedGradingFile } from "$lib/stores/gradingFile";
import { save_text_file_native } from "$lib/utils/nativeSave";

export type Algo = "commits";

// Email helpers
function clean_quotes(s: string): string {
    return (s || "")
        .replace(/[“”‘’"]/g, "")
        .trim()
        .toLowerCase();
}

function extract_first_email(s: string): string | null {
    const text = clean_quotes(s);
    const angle = text.match(/<([^>]+)>/);
    const candidate = angle ? angle[1] : text;
    const m = candidate.match(/[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}/i);
    return m ? m[0].toLowerCase() : null;
}

function norm_email(s: string | undefined | null): string {
    return extract_first_email(s || "") ?? "";
}

// contacts can be string | string[] | object { Email: "..." }
function extract_emails_from_contacts(contacts: unknown): string[] {
    const out: string[] = [];
    const push_email = (val: unknown) => {
        const e = norm_email(String(val ?? ""));
        if (e) out.push(e);
    };

    if (typeof contacts === "string") {
        push_email(contacts);
    } else if (Array.isArray(contacts)) {
        for (const c of contacts) push_email(c);
    } else if (contacts && typeof contacts === "object") {
        for (const v of Object.values(contacts as Record<string, unknown>)) {
            push_email(v);
        }
    }

    return Array.from(new Set(out));
}

function pick_best_contributor(cands: Contributor[]): Contributor | null {
    if (cands.length === 0) return null;
    if (cands.length === 1) return cands[0];
    let best = cands[0];
    for (let i = 1; i < cands.length; i++) {
        if (cands[i].total_commits > best.total_commits) best = cands[i];
    }
    return best;
}

function emails_match(a: string, b: string): boolean {
    if (!a || !b) return false;
    return a === b || a.includes(b) || b.includes(a);
}

function find_contributor_by_email(
    contributors: Contributor[],
    email_cell: string
): Contributor | null {
    const target = norm_email(email_cell);
    if (!target) return null;

    const candidates: Contributor[] = [];
    for (const c of contributors) {
        const emails = extract_emails_from_contacts(c.contacts);
        if (emails.some((e) => emails_match(e, target))) {
            candidates.push(c);
        }
    }
    return pick_best_contributor(candidates);
}

// Main population
/**
 * Build a new CSV/TSV using:
 * - original headers/rows
 * - contributors from current page
 * - scaling factors derived from commits
 *
 * Columns added (if missing):
 *   Scaling Factor | Scaled Grade
 */
export function populate_using_metrics(
    contributors: Contributor[],
    uploaded: UploadedGradingFile
): string {
    const { headers, delimiter, rows } = parse_rows(uploaded.bytes);

    const FACTOR_COL = "Scaling Factor";
    const SCALED_COL = "Scaled Grade";

    const out_headers = [...headers];
    if (!out_headers.includes(FACTOR_COL)) out_headers.push(FACTOR_COL);
    if (!out_headers.includes(SCALED_COL)) out_headers.push(SCALED_COL);

    const mean = get_average_commits(contributors);
    const sd = get_sd(contributors);

    const email_key = headers.find(
        (h) => h.trim().toLowerCase() === "email address"
    );
    const grade_key = headers.find((h) => h.trim().toLowerCase() === "grade");

    const out_rows = rows.map((row) => {
        const email = email_key ? row[email_key] : "";
        const c = find_contributor_by_email(contributors, email);

        const factor_str = c
            ? calculate_scaling_factor(c.total_commits, mean, sd).toFixed(2)
            : "NA";

        const raw = parse_number_cell(grade_key ? row[grade_key] : undefined);
        const scaled =
            raw != null && c ? +(raw * Number(factor_str)).toFixed(2) : null;

        const next: Record<string, string> = { ...row };
        next[FACTOR_COL] = factor_str;
        next[SCALED_COL] = scaled != null ? String(scaled) : "";
        return next;
    });

    return stringify_rows(out_headers, out_rows, delimiter);
}

export async function download_populated_file(
    contributors: Contributor[],
    uploaded: UploadedGradingFile
): Promise<void> {
    const { text, matched, total } = populate_with_stats(
        contributors,
        uploaded
    );
    await save_text_file_native("populated-grading-sheet.csv", text);
    await info(`[grading] matched ${matched}/${total} rows`);
}

export function populate_with_stats(
    contributors: Contributor[],
    uploaded: UploadedGradingFile
): { text: string; matched: number; total: number } {
    const { headers, rows } = parse_rows(uploaded.bytes);

    const email_key = headers.find(
        (h) => h.trim().toLowerCase() === "email address"
    );
    let matched = 0;

    // peek matches without rebuilding everything twice
    for (const row of rows) {
        const email = email_key ? row[email_key] : "";
        if (find_contributor_by_email(contributors, email)) matched++;
    }

    const text = populate_using_metrics(contributors, uploaded);
    return { text, matched, total: rows.length };
}

export function count_matches(
    contributors: Contributor[],
    bytes: Uint8Array
): { matched: number; total: number } {
    const { headers, rows } = parse_rows(bytes);

    const email_key =
        headers.find((h) => h.trim().toLowerCase() === "email address") ?? null;

    if (!email_key) return { matched: 0, total: rows.length };

    let matched = 0;
    for (const row of rows) {
        const email = row[email_key] ?? "";
        const c = find_contributor_by_email(contributors, email);
        if (c) matched += 1;
    }
    return { matched, total: rows.length };
}

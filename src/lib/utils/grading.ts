// src/lib/utils/grading.ts
import type { Contributor } from "$lib/metrics";
import {
  get_average_commits,
  get_sd,
  calculate_scaling_factor
} from "$lib/metrics";

import {
    parseRows,
    stringifyRows,
    parseNumberCell
} from "$lib/utils/csv";

import type { UploadedGradingFile } from "$lib/stores/gradingFile";
import { saveTextFileNative } from "$lib/utils/nativeSave";

export type Algo = "commits"; // ready to extend later


function cleanQuotes(s: string): string {
    return (s || "")
        .replace(/[“”‘’"]/g, "")
        .trim()
        .toLowerCase();
}

function extractFirstEmail(s: string): string | null {
    const text = cleanQuotes(s);
    const angle = text.match(/<([^>]+)>/);
    const candidate = angle ? angle[1] : text;
    const m = candidate.match(/[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}/i);
    return m ? m[0].toLowerCase() : null;
}

function normEmail(s: string | undefined | null): string {
    return extractFirstEmail(s || "") ?? "";
}

// contacts can be string | string[] | object { Email: "..." }
function extractEmailsFromContacts(contacts: unknown): string[] {
    const out: string[] = [];
    const pushEmail = (val: unknown) => {
        const e = normEmail(String(val ?? ""));
        if (e) out.push(e);
    };

    if (typeof contacts === "string") {
        pushEmail(contacts);

    } else if (Array.isArray(contacts)) {
        for (const c of contacts) pushEmail(c);

    } else if (contacts && typeof contacts === "object") {
        for (const v of Object.values(contacts as Record<string, unknown>)) {
            pushEmail(v);
        }
    }

    return Array.from(new Set(out));
}

function pickBestContributor(cands: Contributor[]): Contributor | null {
    if (cands.length === 0) return null;
    if (cands.length === 1) return cands[0];
    let best = cands[0];
    for (let i = 1; i < cands.length; i++) {
        if (cands[i].total_commits > best.total_commits) best = cands[i];
    }
    console.warn("[grading] multiple candidates; picked most commits", {
        picked: { commits: best.total_commits, contacts: best.contacts },
        candidates: cands.map(c => ({
        commits: c.total_commits,
        contacts: c.contacts
        }))
    });
    return best;
}

function emailsMatch(a: string, b: string): boolean {
    if (!a || !b) return false;
    return a === b || a.includes(b) || b.includes(a);
}

function findContributorByEmail(contributors: Contributor[], emailCell: string): Contributor | null {
    const target = normEmail(emailCell);
    if (!target) return null;

    const candidates: Contributor[] = [];
    for (const c of contributors) {
        const emails = extractEmailsFromContacts(c.contacts);
        if (emails.some(e => emailsMatch(e, target))) {
            candidates.push(c);
        }
    }
    return pickBestContributor(candidates);
}

export function populateUsingMetrics(
    contributors: Contributor[],
    uploaded: UploadedGradingFile
): string {
    const { headers, delimiter, rows } = parseRows(uploaded.bytes);

    const FACTOR_COL = "Scaling Factor";
    const SCALED_COL = "Scaled Grade";

    const outHeaders = [...headers];
    if (!outHeaders.includes(FACTOR_COL)) outHeaders.push(FACTOR_COL);
    if (!outHeaders.includes(SCALED_COL)) outHeaders.push(SCALED_COL);

    const mean = get_average_commits(contributors);
    const sd = get_sd(contributors);

    const emailKey = headers.find(h => h.trim().toLowerCase() === "email address");
    const gradeKey = headers.find(h => h.trim().toLowerCase() === "grade");

    const outRows = rows.map(row => {
        const email = emailKey ? row[emailKey] : "";
        const c = findContributorByEmail(contributors, email);

        const factorStr = c
        ? calculate_scaling_factor(c.total_commits, mean, sd).toFixed(2)
        : "NA";

        const raw = parseNumberCell(gradeKey ? row[gradeKey] : undefined);
        const scaled = raw != null && c ? +(raw * Number(factorStr)).toFixed(2) : null;

        const next: Record<string, string> = { ...row };
        next[FACTOR_COL] = factorStr;
        next[SCALED_COL] = scaled != null ? String(scaled) : "";

        console.debug("[grading] row", {
            emailCell: row[emailKey ?? ""],
            matched: !!c,
            contributorEmails: c ? extractEmailsFromContacts(c.contacts) : [],
            commits: c?.total_commits ?? null,
            factor: next[FACTOR_COL]
        });

        return next;
    });

    return stringifyRows(outHeaders, outRows, delimiter);
}


export async function downloadPopulatedFile(
    contributors: Contributor[],
    uploaded: UploadedGradingFile
) {
    const text = populateUsingMetrics(contributors, uploaded);
    await saveTextFileNative("populated-grading-sheet.csv", text);
}
import { writable } from "svelte/store";

// Key is repo_path, value is a Map of contributor email to summary
export const summaries_store = writable<Map<string, Map<string, string>>>(
    new Map()
);

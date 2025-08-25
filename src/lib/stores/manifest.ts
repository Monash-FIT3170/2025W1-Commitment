import { writable, get } from "svelte/store";

export interface RepoSchema {
    bookmarked: boolean;
    cloned: boolean;
    email_mapping: string | null;
    grading_sheet: string | null;
    last_accessed: string;
    name: string;
    path: string;
    url: string;
}

export interface ManifestSchema {
    repository: RepoSchema[];
}

// Accepts either a Manifest object or a raw array of repos and normalizes it
type ManifestInput = ManifestSchema | RepoSchema[];

function normalize(input: ManifestInput): ManifestSchema {
    if (Array.isArray(input)) return { repository: input };
    return input;
}

function createManifestStore() {
    const { subscribe, set, update } = writable<ManifestSchema>({ repository: [] });

    return {
        subscribe,

        /** Replace the whole manifest. Accepts {repository:[...]} or RepoSchema[]. */
        replace(payload: ManifestInput) {
            set(normalize(payload));
        },

        /** Directly set a ManifestSchema (use replace() if you're not sure of the shape). */
        set(manifest: ManifestSchema) {
            set(manifest);
        },

        /** Add or update a repo by name (merges fields). */
        upsert(repo: RepoSchema) {
            update((m) => {
                const idx = m.repository.findIndex((r) => r.name === repo.name);
                if (idx === -1) {
                    return { repository: [...m.repository, repo] };
                }
                const next = m.repository.slice();
                next[idx] = { ...next[idx], ...repo };
                return { repository: next };
            });
        },

        /** Remove a repo by name. */
        remove(name: string) {
            update((m) => ({
                repository: m.repository.filter((r) => r.name !== name),
            }));
        },

        /** Bookmark a repo by name. Returns the changed repo (if any). */
        bookmark(url: string): RepoSchema | undefined {
            let changed: RepoSchema | undefined;
            update((m) => {
                const next = m.repository.map((r) => {
                    if (r.url === url) {
                        changed = { ...r, bookmarked: true };
                        return changed!;
                    }
                    return r;
                });
                return { repository: next };
            });
            return changed;
        },

        /** Unbookmark a repo by name. Returns the changed repo (if any). */
        unbookmark(url: string): RepoSchema | undefined {
            let changed: RepoSchema | undefined;
            update((m) => {
                const next = m.repository.map((r) => {
                    if (r.url === url) {
                        changed = { ...r, bookmarked: false };
                        return changed!;
                    }
                    return r;
                });
                return { repository: next };
            });
            return changed;
        },

        /** Toggle bookmark. */
        toggleBookmark(name: string): RepoSchema | undefined {
            let changed: RepoSchema | undefined;
            update((m) => {
                const next = m.repository.map((r) => {
                    if (r.name === name) {
                        changed = { ...r, bookmarked: !r.bookmarked };
                        return changed!;
                    }
                    return r;
                });
                return { repository: next };
            });
            return changed;
        },

        get_bookmark(): RepoSchema[] {
            return get({ subscribe }).repository.filter(r => r.bookmarked);
        },
    };
}

export const manifest = createManifestStore();

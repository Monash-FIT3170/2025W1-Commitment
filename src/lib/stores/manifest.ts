import { invoke } from "@tauri-apps/api/core";
import { writable, get } from "svelte/store";

export interface Config {
    [group: string]: string[];
}

export interface RepoSchema {
    bookmarked: boolean;
    cloned: boolean;
    email_mapping: Config | null;
    grading_sheet: string | null;
    last_accessed: string;
    name: string;
    path: string;
    url: string;
}

export interface ManifestSchema {
    repository: RepoSchema[];
}

interface BackendVerificationResult {
    owner: string;
    repo: string;
    source_type: 0 | 1 | 2;
}

// Accepts either a Manifest object or a raw array of repos and normalizes it
type ManifestInput = ManifestSchema | RepoSchema[];

function normalize(input: ManifestInput): ManifestSchema {
    if (Array.isArray(input)) return { repository: input };
    return input;
}

function create_manifest_store() {
    const { subscribe, set, update } = writable<ManifestSchema>({
        repository: [],
    });

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
                const idx = m.repository.findIndex(
                    (r: any) => r.name === repo.name
                );
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
        toggle_bookmark(name: string): RepoSchema | undefined {
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
            return get({ subscribe }).repository.filter((r) => r.bookmarked);
        },

        /** Create a new repository inside of the manifest file */
        async create_repository(
            backendResult: BackendVerificationResult,
            repo_url: string
        ) {
            const working_dir = await invoke<string>("get_working_directory");

            const new_repo: RepoSchema = {
                name: backendResult.repo,
                url: repo_url,
                path: `${working_dir}/gitguage/repositories/${repo_url.split("/")[3]}-${repo_url.split("/")[4]}`,
                bookmarked: false,
                cloned: true,
                email_mapping: null,
                grading_sheet: null,
                last_accessed: new Date().toISOString(),
            };
            update((m) => ({
                repository: [...m.repository, new_repo],
            }));
        },

        /** Update the last accessed timestamp of a repository. */
        update_repository_timestamp(url: string) {
            update((m) => {
                const repo = m.repository.find((r) => r.url === url);
                if (repo) {
                    repo.last_accessed = new Date().toISOString();
                }
                return { repository: [...m.repository] };
            });
        },

        /** Update email_mapping for repositories using a config object. */
        update_email_mapping(config: Config, repo_url: string) {
            update((m) => {
                const next = m.repository.map((repo) => {
                    if (repo.url === repo_url) {
                        return {
                            ...repo,
                            email_mapping: config,
                        };
                    }
                    return repo;
                });
                return { repository: next };
            });
        },
    };
}

export const manifest = create_manifest_store();

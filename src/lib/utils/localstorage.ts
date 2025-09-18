import { browser } from "$app/environment";
import type { Contributor } from "$lib/metrics";
import { error } from "@tauri-apps/plugin-log";
let STORAGE_KEY = "page_state";
export function load_state(s: any) {
    if (browser) {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                Object.assign(s, parsed); // Merge into page.state
            }
        } catch (e) {
            error("Failed to load page state from storage:", e);
        }
    }
}

// Function to save state to localStorage
export async function save_state(s: any) {
    if (browser) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
        } catch (e) {
            error("Failed to save page state to storage:", e);
        }
    }
}

import type { RepositoryInformation } from "$lib/stores/manifest";

export async function generate_state_object(
    working_dir: string,
    repository_information: RepositoryInformation,
    repo_url: string,
    source_type: 0 | 1 | 2,
    branches: string[],
    contributors: Contributor[],
    selected_branch: string = ""
) {
    return {
        repo_path:
            source_type === 2
                ? repo_url
                : `${working_dir}/repositories/${source_type}-${repository_information.owner}-${repository_information.repo}`,
        repo_url: repo_url,
        owner: repository_information.owner,
        repo: repository_information.repo,
        source_type: source_type,
        selected_branch: selected_branch,
        branches: branches,
        contributors: contributors,
    };
}

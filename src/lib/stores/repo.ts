import { writable } from "svelte/store";
import type { Repo } from "$lib/repo";
import { get_repo_type } from "$lib/repo";

export const current_repo = writable<Repo>({
    "repo_url": "https://github.com/Monash/FIT3170/2025W1-Commitment.git",
    "repo_path": "Monash/FIT3170/2025W1-Commitment",
    "repo_type": "github"
});

export function set_repo_url(repo: string) {
    let name = new URL(repo).pathname.slice(1);
    current_repo.set({
        "repo_url": repo,
        "repo_path": name,
        "repo_type": get_repo_type(repo)
    });
}
export interface RepoOption {
    label: string;
    icon: string;
    source_type: 0 | 1 | 2;
}

export const repo_options: RepoOption[] = [
    { label: "GitHub", icon: "brand-github", source_type: 0 },
    { label: "GitLab", icon: "brand-gitlab", source_type: 1 },
    { label: "Local", icon: "folder-code", source_type: 2 },
];

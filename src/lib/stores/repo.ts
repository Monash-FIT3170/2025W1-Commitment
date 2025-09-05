import { writable } from "svelte/store";

export type Repo = {
    repo_name: string;
    repo_url: string;
    repo_type: string;
};

export function get_repo_type(url: string) {
    const domain = new URL(url).hostname;

    if (domain.includes("github.com")) {
        return "github";
    } else if (domain.includes("gitlab.com")) {
        return "gitlab";
    } else {
        return "Unknown";
    }
}

export function get_repo_name(url: string) {
    let result = new URL(url).pathname.split("/").at(-1);
    if (result) {
        return result;
    } else {
        return "Unknown";
    }
}

export const current_repo = writable<Repo>();

export function set_repo_url(repo: string) {
    let name = new URL(repo).pathname.slice(1);
    current_repo.set({
        repo_url: repo,
        repo_name: name,
        repo_type: get_repo_type(repo),
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

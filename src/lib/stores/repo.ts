import { writable } from "svelte/store";
import type { Repo } from "$lib/repo";
import { getRepoType } from "$lib/repo";

export const currentRepo = writable<Repo>({
  "repoUrl": "https://github.com/Monash/FIT3170/2025W1-Commitment.git",
  "repoPath": "Monash/FIT3170/2025W1-Commitment",
  "repoType": "github"
});

export function setRepoUrl(repo: string) {
  let name = new URL(repo).pathname.slice(1);
  currentRepo.set({
    "repoUrl": repo,
    "repoPath": name,
    "repoType": getRepoType(repo)
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
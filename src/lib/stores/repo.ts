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
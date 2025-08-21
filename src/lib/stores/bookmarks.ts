import { writable, get } from 'svelte/store';
import type { Repo } from '$lib/repo';

function createBookmarks() {
  const { subscribe, set, update } = writable<Repo[]>([
    { repoPath: "fit3170-A1", repoUrl: "https://github.com/user/fit3170-A1.git", repoType: "github" },
    { repoPath: "this-is-a-repo", repoUrl: "https://gitlab.com/abc0012/this-is-a-repo.git", repoType: "github" },
    { repoPath: "project", repoUrl: "https://github.com/example-org/project.git", repoType: "github" },
  ]);

  return {
    subscribe,
    add: (bookmark: Repo) =>
      update(bookmarks => {
        if (!bookmarks.find(b => b.repoUrl === bookmark.repoUrl)) {
          return [...bookmarks, bookmark];
        }
        return bookmarks;
      }),

    remove: (repo_url: string) =>
      update(bookmarks => bookmarks.filter(b => b.repoUrl !== repo_url)),

    toggle: (bookmark: Repo) =>
      update(bookmarks => {
        const exists = bookmarks.find(b => b.repoUrl === bookmark.repoUrl);
        if (exists) {
          return bookmarks.filter(b => b.repoUrl !== bookmark.repoUrl);
        } else {
          return [...bookmarks, bookmark];
        }
      }),

    clear: () => set([]),

    contains: (repo_url: string): boolean => {
      return get({ subscribe }).some(b => b.repoUrl === repo_url)
    }
  };
}

export const bookmarks = createBookmarks();
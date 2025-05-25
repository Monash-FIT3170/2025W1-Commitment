import { writable, get } from 'svelte/store';

export type Bookmark = {
  repoName: string;
  repoUrl: string;
};

function createBookmarks() {
  const { subscribe, set, update } = writable<Bookmark[]>([
    { repoName: "fit3170-A1", repoUrl: "https://github.com/user/fit3170-A1.git" },
    { repoName: "this-is-a-repo", repoUrl: "https://gitlab.com/abc0012/this-is-a-repo.git" },
    { repoName: "project", repoUrl: "https://github.com/example-org/project.git" },
  ]);

  return {
    subscribe,
    add: (bookmark: Bookmark) =>
      update(bookmarks => {
        if (!bookmarks.find(b => b.repoUrl === bookmark.repoUrl)) {
          return [...bookmarks, bookmark];
        }
        return bookmarks;
      }),

    remove: (repo_url: string) =>
      update(bookmarks => bookmarks.filter(b => b.repoUrl !== repo_url)),

    toggle: (bookmark: Bookmark) =>
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

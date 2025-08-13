import { writable, get } from 'svelte/store';
import type { Repo } from '$lib/repo';

function create_bookmarks() {
    const { subscribe, set, update } = writable<Repo[]>([
        { repo_path: "fit3170-A1", repo_url: "https://github.com/user/fit3170-A1.git", repo_type: "github" },
        { repo_path: "this-is-a-repo", repo_url: "https://gitlab.com/abc0012/this-is-a-repo.git", repo_type: "github" },
        { repo_path: "project", repo_url: "https://github.com/example-org/project.git", repo_type: "github" },
    ]);

    return {
        subscribe,
        add: (bookmark: Repo) =>
            update(bookmarks => {
                if (!bookmarks.find(b => b.repo_url === bookmark.repo_url)) {
                    return [...bookmarks, bookmark];
                }
                return bookmarks;
            }),

        remove: (repo_url: string) =>
            update(bookmarks => bookmarks.filter(b => b.repo_url !== repo_url)),

        toggle: (bookmark: Repo) =>
            update(bookmarks => {
                const exists = bookmarks.find(b => b.repo_url === bookmark.repo_url);
                if (exists) {
                    return bookmarks.filter(b => b.repo_url !== bookmark.repo_url);
                } else {
                    return [...bookmarks, bookmark];
                }
            }),

        clear: () => set([]),

        contains: (repo_url: string): boolean => {
            return get({ subscribe }).some(b => b.repo_url === repo_url)
        }
    };
}

export const bookmarks = create_bookmarks();

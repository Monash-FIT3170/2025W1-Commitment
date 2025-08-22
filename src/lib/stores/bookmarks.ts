import { writable, get } from 'svelte/store';
import type { Repo } from '$lib/repo';
import { invoke } from "@tauri-apps/api/core";

function create_bookmarks() {
  const { subscribe, set, update } = writable<Repo[]>([]);

  async function load() {
    try {
      const bookmarks = await invoke<Repo[]>('get_bookmarked_repositories');
      set(bookmarks);
    } catch (error) {
      console.error("Failed to load bookmarks:", error);
      set([]); // Set to empty array on failure
    }
  }

  // Load initial bookmarks from the backend
  load();

  async function set_bookmark_state(repo: Repo, bookmarked: boolean) {
    try {
      await invoke('set_bookmarked_repository', { repo_url: repo.repo_url, bookmarked });
      if (bookmarked) {
        update(bookmarks => {
          if (!bookmarks.find(b => b.repo_url === repo.repo_url)) {
            return [...bookmarks, repo];
          }
          return bookmarks;
        });
      } else {
        update(bookmarks => bookmarks.filter(b => b.repo_url !== repo.repo_url));
      }
    } catch (error) {
      console.error(`Failed to set bookmark state to ${bookmarked} for ${repo.repo_url}:`, error);
      // Optionally, you could add logic here to revert the UI change or show an error to the user.
    }
  }

  return {
    subscribe,
    add: async (bookmark: Repo) => {
      await set_bookmark_state(bookmark, true);
    },

    remove: async (repo_url: string) => {
      // We need the full Repo object to potentially add it back on error,
      // but for removal, the URL is sufficient for the backend call.
      // For simplicity, we'll just pass a partial object.
      await set_bookmark_state({ repo_url } as Repo, false);
    },

    toggle: async (bookmark: Repo) => {
      const exists = get({ subscribe }).some(b => b.repo_url === bookmark.repo_url);
      await set_bookmark_state(bookmark, !exists);
    },

    clear: () => {
      // Note: This only clears the local store.
      // If you need to clear all bookmarks in the backend, you'd implement that logic here.
      set([]);
    },

    contains: (repo_url: string): boolean => {
      return get({ subscribe }).some(b => b.repo_url === repo_url)
    },
    
    reload: load // Expose a method to reload from backend if needed
  };
}

export const bookmarks = create_bookmarks();

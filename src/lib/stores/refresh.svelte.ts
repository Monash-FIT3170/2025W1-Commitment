// Refresh state using Svelte 5 runes pattern
// NOTE: This file uses .svelte.ts extension to enable runes

class RefreshState {
    refresh_function = $state<(() => void) | null>(null);
    refreshing = $state(false);
    delete_function = $state<(() => void) | null>(null);
}

// Create a singleton instance
export const refresh_state = new RefreshState();

export function set_refresh_function(fn: () => void) {
    refresh_state.refresh_function = fn;
}

export function set_refreshing(value: boolean) {
    refresh_state.refreshing = value;
}

export function set_delete_function(fn: () => void) {
    refresh_state.delete_function = fn;
}

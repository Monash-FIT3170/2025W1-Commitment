// Loading state using Svelte 5 runes pattern
// NOTE: This file uses .svelte.ts extension to enable runes

class LoadingState {
    loading = $state(false);
}

// Create a singleton instance
export const loading_state = new LoadingState();

export function set_loading(value: boolean) {
    loading_state.loading = value;
}

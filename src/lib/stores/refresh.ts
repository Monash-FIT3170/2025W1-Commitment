import { writable } from "svelte/store";

export interface RefreshState {
    refresh_function: (() => void) | null;
    refreshing: boolean;
}

export const refresh_store = writable<RefreshState>({
    refresh_function: null,
    refreshing: false,
});

export function set_refresh_function(fn: () => void) {
    refresh_store.update((state) => ({ ...state, refresh_function: fn }));
}

export function set_refreshing(value: boolean) {
    refresh_store.update((state) => ({ ...state, refreshing: value }));
}

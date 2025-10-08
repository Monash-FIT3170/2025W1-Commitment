import { writable } from "svelte/store";

export interface RefreshState {
    refresh_function: (() => void) | null;
    refreshing: boolean;
    delete_function: (() => void) | null;
}

export const refresh_store = writable<RefreshState>({
    refresh_function: null,
    refreshing: false,
    delete_function: null,
});

export function set_refresh_function(fn: () => void) {
    refresh_store.update((state) => ({ ...state, refresh_function: fn }));
}

export function set_refreshing(value: boolean) {
    refresh_store.update((state) => ({ ...state, refreshing: value }));
}

export function set_delete_function(fn: () => void) {
    refresh_store.update((state) => ({ ...state, delete_function: fn }));
}

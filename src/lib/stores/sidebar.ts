import { writable } from 'svelte/store';

export const sidebar_open = writable(false);

export function toggle_sidebar() {
    sidebar_open.update(open => !open);
}

export function open_sidebar() {
    sidebar_open.set(true);
}

export function close_sidebar() {
    sidebar_open.set(false);
}

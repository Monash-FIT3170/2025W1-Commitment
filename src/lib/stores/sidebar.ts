import { writable } from 'svelte/store';

export const sidebarOpen = writable(false);

export function toggleSidebar() {
  sidebarOpen.update(open => !open);
}

export function openSidebar() {
  sidebarOpen.set(true);
}

export function closeSidebar() {
  sidebarOpen.set(false);
}

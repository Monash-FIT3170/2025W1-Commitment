import { writable } from "svelte/store";

export function createDropdownSelection<T>(initialSelected: T | null = null) {
  const selected = writable<T | null>(initialSelected);

  // Set selection function
  function select(option: T) {
    selected.set(option);
  }

  return {
    selected,
    select,
  };
}
import { writable } from "svelte/store";

export function create_dropdown_selection<T>(initial_selected: T | null = null) {
    const selected = writable<T | null>(initial_selected);

    // Set selection function
    function select(option: T) {
        selected.set(option);
    }

    return {
        selected,
        select,
    };
}

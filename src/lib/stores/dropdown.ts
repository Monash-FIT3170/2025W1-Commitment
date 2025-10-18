import { writable } from "svelte/store";

export function create_dropdown_selection<T>(
    initial_selected: T | null = null
) {
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

// Global dropdown state management
// This ensures only one dropdown is open at a time
export const open_dropdown_id = writable<string | null>(null);

export function open_dropdown(id: string) {
    open_dropdown_id.set(id);
}

export function close_all_dropdowns() {
    open_dropdown_id.set(null);
}

// Function to call when modals open to ensure all dropdowns close
export function on_modal_open() {
    close_all_dropdowns();
}

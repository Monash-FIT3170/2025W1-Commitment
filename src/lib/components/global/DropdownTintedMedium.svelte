<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import type { Writable } from "svelte/store";
    import Icon from "@iconify/svelte";

    let {
        options = [],
        selected = null,
        disabled = false,
        get_label = (opt: any) =>
            typeof opt === "string" ? opt : (opt.label ?? String(opt)),
    }: {
        options: any[];
        selected: Writable<any> | null;
        disabled: boolean;
        get_label?: (opt: any) => string;
    } = $props();

    let open = $state(false);

    function toggle_dropdown() {
        if (!disabled) open = !open;
    }

    function select_option(option: any) {
        if (selected) selected.set(option);
        open = false;
    }

    function handle_click_outside(event: MouseEvent) {
        if (
            !event.target ||
            !(event.target as HTMLElement).closest(".dropdown-wrapper")
        ) {
            open = false;
        }
    }

    onMount(() => {
        document.addEventListener("click", handle_click_outside);
    });

    onDestroy(() => {
        document.removeEventListener("click", handle_click_outside);
    });
</script>

<div class="dropdown-wrapper">
    <button
        type="button"
        class="dropdown-toggle"
        aria-haspopup="listbox"
        aria-expanded={open}
        onclick={toggle_dropdown}
        {disabled}
    >
        <span class="selected-label body"
            >{selected ? get_label($selected) : "Select an option"}</span
        >
        <Icon
            icon={open ? "tabler:chevron-up" : "tabler:chevron-down"}
            class="icon-medium"
            style="color: currentColor"
        />
    </button>

    {#if open}
        <ul class="dropdown-list" role="listbox" tabindex="-1">
            {#each options as option (get_label(option))}
                <li
                    role="option"
                    aria-selected={selected && option === $selected}
                    class="dropdown-item body {selected && option === $selected
                        ? 'selected'
                        : ''}"
                    onclick={() => select_option(option)}
                    onkeydown={(e) =>
                        e.key === "Enter" && select_option(option)}
                    tabindex="0"
                >
                    {get_label(option)}
                </li>
            {/each}
        </ul>
    {/if}
</div>

<style>
    .dropdown-wrapper {
        position: relative;
    }

    .dropdown-toggle {
        all: unset;
        display: inline-flex;
        justify-content: space-between;
        align-items: center;
        min-width: 15rem;
        background-color: var(--tint-00);
        cursor: pointer;
        transition: background-color 0.2s ease;
        gap: 4px;
        padding: 0.5rem 1.2rem;
        border-radius: 8px;
    }
    .dropdown-toggle:hover {
        background-color: var(--tint-01);
    }
    .dropdown-toggle:active {
        background-color: var(--tint-02);
    }
    .dropdown-toggle:disabled {
        background-color: var(--tint-00);
        cursor: not-allowed;
        color: var(--label-secondary);
    }

    .dropdown-toggle[aria-expanded="true"] {
        border-bottom-left-radius: 0;
        border-bottom-right-radius: 0;
        border-bottom: 1px solid white;
    }

    .selected-label {
        flex-grow: 1;
        text-align: left;
    }

    .dropdown-list {
        position: absolute;
        top: 100%;
        left: 0;
        width: 100%;
        margin: 0;
        padding: 0.5rem 0;
        list-style: none;
        background: var(--background-primary);
        border-radius: 0 0 8px 8px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
        z-index: 100;
        box-sizing: border-box;
    }

    /* Options */
    .dropdown-item {
        padding: 0.5rem 1rem;
        cursor: pointer;
    }
    .dropdown-item:hover,
    .dropdown-item:focus {
        background-color: var(--tint-01);
        outline: none;
    }
    .dropdown-item.selected {
        background-color: var(--tint-02);
        font-weight: 600;
    }
</style>

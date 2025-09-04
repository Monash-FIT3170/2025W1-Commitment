<script lang="ts">
    import { onMount } from "svelte";

    let {
        show_modal = $bindable(false),
        header = null,
        body = null,
        on_cancel = null,
    } = $props();

    let panel_el = $state<HTMLDivElement | null>(null);

    function close() {
        on_cancel?.();
        show_modal = false;
    }

    // Backdrop keyboard handler (Enter/Space triggers close)
    function on_backdrop_key(e: KeyboardEvent) {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            close();
        }
    }

    // Dialog keyboard handler (Esc closes)
    function on_dialog_key(e: KeyboardEvent) {
        if (e.key === "Escape") close();
    }

    // Auto-focus the dialog when shown
    onMount(() => {
        if (show_modal) panel_el?.focus();
    });

    $effect(() => {
        if (show_modal) queueMicrotask(() => panel_el?.focus());
    });
</script>

{#if show_modal}
    <!-- Backdrop -->
    <div
        class="backdrop"
        tabindex="0"
        role="button"
        aria-label="Close dialog"
        onclick={close}
        onkeydown={on_backdrop_key}
    >
        <!-- Dialog -->
        <div
            class="modal"
            role="dialog"
            aria-modal="true"
            tabindex="-1"
            onkeydown={on_dialog_key}
            onclick={(e) => e.stopPropagation()}
            bind:this={panel_el}
        >
            <div class="row">
                {@render header?.()}
                <button
                    class="x"
                    type="button"
                    onclick={close}
                    aria-label="Close">✕</button
                >
            </div>
            {@render body?.()}
        </div>
    </div>
{/if}

<style>
    .backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.55);
        display: grid;
        place-items: center;
        z-index: 9999;
        -webkit-backdrop-filter: blur(0.5rem);
        backdrop-filter: blur(0.5rem);
        transition:
            backdrop-filter 120ms ease,
            background 120ms ease;
    }

    .modal {
        width: min(35rem, 92vw);
        background: var(--background-secondary);
        color: var(--label-primary);
        border: 0.0625rem solid var(--fill-03);
        border-radius: 0.75rem;
        padding: 1rem;
        box-shadow: 0 0.625rem 1.875rem rgba(0, 0, 0, 0.4);
        outline: none;
    }

    .row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
    }

    .x {
        all: unset;
        cursor: pointer;
        padding: 0.375rem;
        border-radius: 0.375rem;
    }

    .x:hover {
        background: var(--background-tertiary);
    }
</style>

<script lang="ts">
    import { onMount } from "svelte";

    let { 
        showModal = $bindable(false), 
        header = null, 
        body = null, 
        oncancel = null 
    } = $props();

    let panelEl: HTMLDivElement | null = null;

    function close() {
        oncancel?.();
        showModal = false;
    }

  // Backdrop keyboard handler (Enter/Space triggers close)
    function onBackdropKey(e: KeyboardEvent) {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            close();
        }
    }

    // Dialog keyboard handler (Esc closes)
    function onDialogKey(e: KeyboardEvent) {
        if (e.key === "Escape") close();
    }

    // Auto-focus the dialog when shown
    onMount(() => {
        if (showModal) panelEl?.focus();
    });
    $effect(() => {
        if (showModal) queueMicrotask(() => panelEl?.focus());
    });
</script>

{#if showModal}
  <!-- Backdrop -->
    <div
        class="backdrop"
        tabindex="0"
        role="button"
        aria-label="Close dialog"
        onclick={close}
        onkeydown={onBackdropKey}
    >
      <!-- Dialog -->
        <div
            class="modal"
            role="dialog"
            aria-modal="true"
            tabindex="-1"
            onkeydown={onDialogKey}
            onclick={(e) => e.stopPropagation()}
            bind:this={panelEl}
        >
            <div class="row">
                {@render header?.()}
                <button class="x" type="button" onclick={close} aria-label="Close">✕</button>
            </div>
            {@render body?.()}
        </div>
    </div>
{/if}

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, .55);
    display: grid;
    place-items: center;
    z-index: 9999;
    -webkit-backdrop-filter: blur(8px); 
    backdrop-filter: blur(8px);
    transition: backdrop-filter 120ms ease, background 120ms ease;
  }

  .modal {
    width: min(560px, 92vw);
    background: var(--background-secondary);
    color: var(--label-primary);
    border: 1px solid var(--fill-03);
    border-radius: 12px;
    padding: 16px;
    box-shadow: 0 10px 30px rgba(0,0,0,.4);
    outline: none;
  }

  .row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  .x {
    all: unset;
    cursor: pointer;
    padding: 6px;
    border-radius: 6px;
  }
  .x:hover {
    background: var(--background-tertiary);
  }
</style>
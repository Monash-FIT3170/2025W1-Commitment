<script lang="ts">
    // Accept header/body snippet props
    let {
        showModal = $bindable(false),
        header = undefined,
        body = undefined
    } = $props();

    function close() { showModal = false; }

    function onBackdropKey(e: KeyboardEvent) {
        if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        close();
        }
    }
</script>

{#if showModal}
    <div
        class="backdrop"
        role="button"
        tabindex="0"
        aria-label="Close dialog"
        onclick={close}
        onkeydown={onBackdropKey}
    >
        <div
        class="modal"
        role="dialog"
        aria-modal="true"
        onclick={(e) => e.stopPropagation()}
        >
        <div class="row">
            <div class="hdr">
            {@render header?.()}
            </div>
            <button class="x" onclick={close} aria-label="Close">✕</button>
        </div>
        <div class="content">
            {@render body?.()}
        </div>
        </div>
    </div>
{/if}


<style>
  .backdrop {
    position: fixed; inset: 0;
    background: rgba(0,0,0,.55);
    display: grid; place-items: center;
    z-index: 9999;
  }
  .modal {
    width: min(560px, 92vw);
    background: #1f1f1f;
    color: #fff;
    border: 1px solid #333;
    border-radius: 12px;
    padding: 16px;
    box-shadow: 0 10px 30px rgba(0,0,0,.4);
  }
  .row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
  .x { all: unset; cursor: pointer; padding: 6px; border-radius: 6px; }
  .x:hover { background: #2a2a2a; }
</style>
<script>
    let { show_modal = false } = $props();
    let dialog = $state();

    $effect(() => {
        if (show_modal && dialog && !dialog.open) {
            dialog.showModal();
        }
    });

    function close() {
        show_modal = false;
    }
</script>

<dialog
    bind:this={dialog}
    onclose={() => (show_modal = false)}
    onclick={(e) => {
        if (e.target === dialog) {
            close();
        }
    }}
>
    <div>
        <slot name="header"></slot>
        <hr />
        <slot></slot>
        <hr />
    </div>
</dialog>

<style>
    dialog {
        max-width: 40em;
        width: 95vw;
        border-radius: 0.5em;
        border: none;
        padding: 0;
        background-color: rgb(29, 29, 29);
        color: #f0f0f0;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
        font-family: system-ui, sans-serif;
    }

    dialog::backdrop {
        background: rgba(0, 0, 0, 0.3);
    }

    dialog > div {
        padding: 1em;
    }

    dialog[open] {
        animation: zoom 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    @keyframes zoom {
        from {
            transform: scale(0.95);
        }
        to {
            transform: scale(1);
        }
    }

    dialog[open]::backdrop {
        animation: fade 0.2s ease-out;
    }

    @keyframes fade {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }

    button {
        display: block;
    }
</style>

<script lang="ts">
    import ButtonPrimaryMedium from "./ButtonPrimaryMedium.svelte";
    import Modal from "$lib/components/overview-page/Modal.svelte";
    import { info } from "@tauri-apps/plugin-log";

    let { show_modal = $bindable(), on_token_add } = $props();

    let personal_access_token = $state("");

    function handle_add_token() {
        info("Processing Personal Access Token...");

        // Call the parent's callback function if provided
        if (on_token_add) {
            on_token_add(personal_access_token);
        }

        // Close the modal
        show_modal = false;
    }
</script>

<!-- Personal Access Token Modal -->
<Modal bind:show_modal>
    {#snippet header()}
        <h2 id="modal-title">Use Personal Access Token</h2>
    {/snippet}

    {#snippet body()}
        <p>
            It seems that the repository you are trying to access is private.<br
            />
            Please provide a Personal Access Token<br />
            <br />
            <bold
                >NOTE: If this repository is not private, please check the URL
                entered</bold
            >
        </p>
        <p class="permission-note">
            Please ensure "Contents" permissions are granted for your Personal
            Access Token
        </p>
        <input
            type="password"
            bind:value={personal_access_token}
            placeholder="Personal Access Token"
            class="token-input"
        />
        <div style="display: flex; justify-content: center; margin-top: 1rem;">
            <ButtonPrimaryMedium label="Use" onclick={handle_add_token} />
        </div>
    {/snippet}
</Modal>

<style>
    .permission-note {
        font-size: 0.75em;
        color: #a0a0a0;
        margin-top: 0.5em;
        margin-bottom: 0.5em;
    }

    .token-input {
        width: calc(100% - 2em);
        padding: 1em;
        border-radius: 0.5em;
        border: 1px solid #555;
        background-color: #1e1e1e;
        color: #fff;
        font-size: 1em;
        margin-top: 1em;
    }
</style>

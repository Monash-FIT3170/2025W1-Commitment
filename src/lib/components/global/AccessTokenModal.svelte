<script lang="ts">
    import ButtonPrimaryMedium from "$lib/components/global/ButtonPrimaryMedium.svelte";
    import Modal from "$lib/components/overview-page/Modal.svelte";
    import { info, error } from "@tauri-apps/plugin-log";
    import LoadingIndicator from "./LoadingIndicator.svelte";
    import Icon from "@iconify/svelte";

    let { 
        show_modal = $bindable(), 
        is_loading = $bindable(), 
        on_token_add 
    } = $props();

    let personal_access_token = $state("");

    async function handle_add_token() {
        is_loading = true;
        try {
            info("Processing Personal Access Token...");
            // Call the parent's callback function if provided
            if (on_token_add) {
                await on_token_add(personal_access_token);
            }
        } catch (error_message) {
            error(`Error processing token: ${error_message}`);
        } finally {
            is_loading = false;
            // Close the modal
            show_modal = false;
        }
    }
</script>

<!-- Personal Access Token Modal -->
<Modal bind:show_modal>
    {#snippet icon()}
        <Icon
            icon={`tabler:key`}
            class="icon-medium"
            style="color: currentColor"
        />
    {/snippet}

    {#snippet header()}
        Use Personal Access Token
    {/snippet}

    {#snippet body()}
        {#if is_loading}
            <LoadingIndicator displayText="Processing token..." />
        {:else}
            <p>
                It seems that the repository you are trying to access is<br
            />
                private. Please provide a Personal Access Token<br />
            <br />
            <bold
                >NOTE: If this repository is not private, please check the URL
                entered</bold
            >
            </p>
            <p class="permission-note">
                Please ensure "Contents" permissions are granted for your
                Personal Access Token
            </p>
            <input
                type="password"
                bind:value={personal_access_token}
                placeholder="Personal Access Token"
                class="token-input"
            />
            <div
                style="display: flex; justify-content: center; margin-top: 1rem;"
            >
                <ButtonPrimaryMedium label="Use" onclick={handle_add_token} />
            </div>
        {/if}
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

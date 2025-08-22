<script lang="ts">
    import ButtonPrimaryMedium from "./ButtonPrimaryMedium.svelte";
    import Modal from "./Modal.svelte";

    let { show_modal = $bindable(), on_token_add } = $props();

    let personal_access_token = $state("");

    function handle_add_token() {
        console.log("Processing Personal Access Token...");

        // Call the parent's callback function if provided
        if (on_token_add) {
            on_token_add(personal_access_token);
        }

        // Close the modal
        show_modal = false;
    }
</script>

<!-- Personal Access Token Modal -->
<Modal bind:showModal={show_modal}>
    <h2 id="modal-title" slot="header">Add Personal Access Token</h2>
    <p>
        It seems that the repository you are trying to access is private. Please
        provide a Personal Access Token
    </p>
    <input
        type="password"
        bind:value={personal_access_token}
        placeholder="Personal Access Token"
        class="token-input"
    />
    <div style="display: flex; justify-content: center; margin-top: 1rem;">
        <ButtonPrimaryMedium label="Add" onclick={handle_add_token} />
    </div>
</Modal>

<style>
    .token-input {
        width: 95%;
        padding: 1em;
        border-radius: 0.5em;
        border: 1px solid #555;
        background-color: #1e1e1e;
        color: #fff;
        font-size: 1em;
        margin-top: 1em;
    }
</style>

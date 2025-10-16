<script lang="ts">
    import Icon from "@iconify/svelte";
    import { invoke } from "@tauri-apps/api/core";
    import { onMount } from "svelte";
    import { info, error } from "@tauri-apps/plugin-log";

    let {
        on_submit = () => {},
        api_input = $bindable<string>(),
        api_error = false,
    } = $props();

    onMount(async () => {
        await check_key_set();
    });

    let editing = $state(false);

    async function check_key_set(): Promise<void> {
        info("Checking for already existing API key...");
        try {
            const input_field = document.getElementById(
                "api-input-field"
            ) as HTMLInputElement;
            let check_key = await invoke<Boolean>("check_key_set");

            if (check_key) {
                api_input = "****************************************";
                input_field.disabled = true;
                editing = false;
            }
        } catch (err) {
            error("Failed to check if key is set: " + err);
        }
    }

    function handle_input_keydown(event: KeyboardEvent) {
        if (event.key === "Enter") {
            toggle_edit();
        }
    }

    async function toggle_edit() {
        const input_field = document.getElementById(
            "api-input-field"
        ) as HTMLInputElement;
        if (editing) {
            let error = await on_submit();
            if (!error) {
                api_input = "";
                return;
            } else {
                input_field.disabled = true;
                editing = false;
            }
        } else {
            input_field.disabled = false;
            input_field.focus();
            editing = true;
        }
    }
</script>

<!--
@component
This is a repository searchbar component that allows users to enter a git
repository URL.

- Usage:
  ```svelte
    <APIKeyField
        bind:api_input={api_input}
        on_submit={handle_submit}
        error={error}
    />
  ```
- Props:
    - `api_input`: A bindable string that holds the API key input by the user.
    - `on_submit`: A function that is called when the user submits the input.
    - `error`: A boolean indicating whether there is an error with the input.
                If true, the input will be styled to indicate an error.
-->

<div class={["api-field", { api_error }]}>
    <input
        id="api-input-field"
        class="api-textbox body"
        type="password"
        placeholder="enter your gemini API key..."
        bind:value={api_input}
        onkeydown={handle_input_keydown}
    />
    <button class="api-button" onclick={toggle_edit}>
        {#if !editing}
            <Icon
                icon={"tabler:pencil"}
                class="icon-medium"
                style="color: white"
            />
        {:else}
            <Icon
                icon={"tabler:circle-arrow-right"}
                class="icon-medium"
                style="color: white"
            />
        {/if}
    </button>
</div>

<style>
    .api-field {
        height: 1.25rem;
        display: flex;
        justify-content: start;
        align-items: center;
        background-color: var(--tint-00);
        padding: 0.5625rem 1.125rem 0.5625rem 1.5rem;
        border-radius: 12px;
        border-style: ridge;
        border-width: 0.125rem;
        border-color: transparent;
    }

    .api-field.api_error {
        border-color: var(--wonderland--ff748b);
        border-style: ridge;
        border-width: 0.125rem;
    }

    .api-textbox {
        flex: 1;
        margin-right: 0.5rem;
        background-color: inherit;
        border: none;
        height: 24px;
        padding: 0px;
        color: white;
    }

    .api-textbox::placeholder {
        font-size: 0.8125rem;
        font-family:
            DM Sans,
            sans-serif;
        font-weight: 400;
        word-wrap: break-word;
    }

    .api-textbox:focus {
        outline: none;
    }

    .api-textbox:disabled {
        color: var(--label-secondary);
    }

    .api-button {
        background-color: inherit;
        border: none;
        padding: 0px;
        cursor: pointer;
        display: flex;
        align-items: center;
    }
</style>

<script lang="ts">
    import Icon from "@iconify/svelte";

    let {
        on_submit = () => {},
        repo_url_input = $bindable<string>(),
        error = false,
    } = $props();

    function handle_input_keydown(event: KeyboardEvent) {
        if (event.key === "Enter") {
            on_submit();
        }
    }
</script>

<!--
@component
This is a repository searchbar component that allows users to enter a git
repository URL.

- Usage:
  ```svelte
    <RepoLinkInput
        bind:repo_url_input={repo_url_input}
        on_submit={handle_submit}
        error={error}
    />
  ```
- Props:
    - `repo_url_input`: A bindable string that holds the repository URL input
                        by the user.
    - `on_submit`: A function that is called when the user submits the input.
    - `error`: A boolean indicating whether there is an error with the input.
                If true, the input will be styled to indicate an error.
-->

<div class={["repo-searchbar", { error }]}>
    <input
        class="repo-textbox display-body"
        type="text"
        placeholder="enter a git repo..."
        bind:value={repo_url_input}
        onkeydown={handle_input_keydown}
    />
    <button class="repo-button" onclick={() => on_submit()}>
        <Icon
            icon={"tabler:circle-arrow-right"}
            class="icon-medium"
            style="color: white"
        />
    </button>
</div>

<style>
    .repo-searchbar {
        height: 1.25rem;
        width: 33rem;
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

    .repo-searchbar.error {
        border-color: var(--wonderland--ff748b);
        border-style: ridge;
        border-width: 0.125rem;
    }

    .repo-textbox {
        flex: 1;
        margin-right: 0.5rem;
        background-color: inherit;
        border: none;
        height: 24px;
        padding: 0px;
        width: 350px;
        color: white;
    }

    .repo-textbox::placeholder {
        font-size: 1.063rem;
        font-family: DM Sans;
        font-weight: 400;
        word-wrap: break-word;
    }

    .repo-textbox:focus {
        outline: none;
    }

    .repo-button {
        background-color: inherit;
        border: none;
        padding: 0px;
        cursor: pointer;
        display: flex;
        align-items: center;
    }
</style>


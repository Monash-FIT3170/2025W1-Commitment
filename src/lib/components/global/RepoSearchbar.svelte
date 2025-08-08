<script lang="ts">
    import Icon from "@iconify/svelte";
    
    let {
        onSubmit = () => {},
        repoUrlInput = $bindable<string>(),
        error = false,
    } = $props();

    function handleInputKeydown(event: KeyboardEvent) {
        if (event.key === "Enter") {
            onSubmit()
        }
    }
</script>

<div class={["repo-link", {error}]}>
    <input
        class="repo-textbox display-body"
        type="text"
        placeholder="enter a git repo..."
        bind:value={repoUrlInput}
        onkeydown={handleInputKeydown}
    />
    <button class="repo-button" onclick={() => onSubmit()}>
        <Icon
            icon={"tabler:circle-arrow-right"}
            class="icon-medium"
            style="color: white"
        />
    </button>
</div>

<style>
    .repo-link {
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

    .repo-link.error {
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
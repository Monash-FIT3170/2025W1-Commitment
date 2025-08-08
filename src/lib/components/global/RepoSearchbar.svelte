<script lang="ts">
    import Icon from "@iconify/svelte";
    
    let {
        onSubmit = () => {},
        repoUrlInput = $bindable<string>()
    } = $props();

    function handleInputKeydown(event: KeyboardEvent) {
        if (event.key === "Enter") {
            onSubmit()
        }
    }
</script>

<div class="repo-link">
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
        height: 1.5rem;
        width: 33rem;
        display: flex;
        justify-content: start;
        align-items: center;
        background-color: #222;
        padding: 0.5625rem 1.125rem 0.5625rem 1.5rem;
        border-radius: 12px;
    }

    .repo-textbox {
        flex: 1;
        margin-right: 0.5rem;
        background-color: #222;
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
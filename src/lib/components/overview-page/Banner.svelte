<script lang="ts">
    import LeftMenu from "./LeftMenu.svelte";
    import LeftMenuWithRepo from "./LeftMenuWithRepo.svelte";
    import RightMenu from "$lib/components/overview-page/RightMenu.svelte";
    import Icon from "@iconify/svelte";

    let {
        owner,
        repo,
        repo_url,
        on_refresh,
        refreshing = false,
        on_delete,
        showBackButton = false,
    }: {
        owner?: string;
        repo?: string;
        repo_url?: string;
        on_refresh?: () => void;
        refreshing?: boolean;
        on_delete?: () => void;
        showBackButton?: boolean;
    } = $props();
    function goBack() {
        window.history.back();
    }
</script>

<!--
@component
This is the header component that contains the left menu and user menu.

This component displays a left menu containing a title for the repository
where relevant, and otherwise displays the full app logo. The user menu
contains the user's name and profile image.

- Usage:
  ```svelte
    <Banner
        repo_url={repo_url}
        repo_path={repo_path}
    />
  ```
- Props:
    - `repo_url`: The URL of the repository (optional).
    - `repo_path`: The path of the repository (optional).
-->

<div class="header">
    {#if showBackButton}
        <div class="left-menu-container">
            <button class="back-btn button-primary" onclick={goBack} aria-label="Back">
                <Icon icon="tabler:circle-arrow-left" class="icon-medium" />
            </button>
        </div>
    {/if}
    <div class="center-menu-container">
        {#if repo_url && owner && repo}
            <LeftMenuWithRepo
                {repo_url}
                {owner}
                {repo}
                {on_refresh}
                {refreshing}
                {on_delete}
            />
        {:else}
            <LeftMenu />
        {/if}
    </div>
    <div class="right-menu-container">
        <RightMenu />
    </div>
</div>

<style>
    .header {
        padding: 2rem 2rem 0rem 2rem;
        height: 1.375rem;
        display: flex;
        gap: 2rem;
        width: 100%;
        justify-content: space-between;
        align-items: center;
        position: relative;
        margin: 0 auto;
    }

    .left-menu-container {
        top: 2rem;
        align-items: center;
    }

    .center-menu-container {
        min-width: 5rem;
        overflow: hidden;
        justify-content: center;
        align-items: center;
    }

    .right-menu-container {
        top: 2rem;
        align-items: center;
        overflow: hidden;
    }

    .back-btn {
        background: none;
        border: none;
        padding: 0px;
        cursor: pointer;
        display: flex;
        color: var(--label-primary);
    }
</style>

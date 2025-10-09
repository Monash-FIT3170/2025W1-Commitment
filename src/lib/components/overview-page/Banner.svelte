<script lang="ts">
    import LeftMenu from "./LeftMenu.svelte";
    import LeftMenuWithRepo from "./LeftMenuWithRepo.svelte";
    import UserMenu from "$lib/components/overview-page/UserMenu.svelte";
    import Icon from "@iconify/svelte";

    let {
        owner,
        repo,
        repo_url,
        on_refresh,
        refreshing = false,
        on_delete,
        username = "",
        profile_image_url = "",
        showBackButton = false
    }: {
        owner?: string;
        repo?: string;
        repo_url?: string;
        username?: string;
        profile_image_url?: string;
        on_refresh?: () => void;
        refreshing?: boolean;
        on_delete?: () => void;
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
        username={username}
        profile_image_url={profile_image_url}
    />
  ```
- Props:
    - `repo_url`: The URL of the repository (optional).
    - `repo_path`: The path of the repository (optional).
    - `username`: The name of the user.
    - `profile_image_url`: The URL of the user's profile image.
-->

<div class="header">
    {#if showBackButton}
        <button class="back-btn" on:click={goBack} aria-label="Back">
            <Icon icon="tabler:arrow-left" width="2rem" height="2rem" />
        </button>
    {/if}
    <div class="left-menu-container">
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
    <div class="user-menu-container">
        <UserMenu {username} {profile_image_url} />
    </div>
</div>

<style>
    .header {
        padding: 2rem 2rem 0rem 2rem;
        height: 1.375rem;
        display: flex;
        gap: 2rem;
        width: 100%;      
        justify-content: center; 
        align-items: center;
        position: relative;
        margin: 0 auto; 
    }

    .left-menu-container {
        flex: 1;
        min-width: 5rem;
        overflow: hidden;
        display: flex;
        justify-content: center;
    }

    .user-menu-container {
        position: absolute;
        right: 2rem; 
        top: 2rem;         
        display: flex;
        align-items: center;
        min-width: 5rem;
        overflow: hidden;
    }

    .back-btn {
        position: absolute;
        left: 2rem;
        top: 2rem;
        background: none;
        border: none;
        cursor: pointer;
        padding: 0;
        display: flex;
        align-items: center;
        z-index: 2;
        color: white;
    }
</style>

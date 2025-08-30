<script lang="ts">
    import LeftMenu from "./LeftMenu.svelte";
    import LeftMenuWithRepo from "./LeftMenuWithRepo.svelte";
    import UserMenu from "$lib/components/overview-page/UserMenu.svelte";

    let {
        repo_url,
        repo_path,
        username = "Baaset Moslih",
        profile_image_url = "/mock_profile_img.png",
    }: {
        repo_url?: string;
        repo_path?: string;
        username?: string;
        profile_image_url?: string;
    } = $props();
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
    <div class="left-menu-container">
        {#if repo_url && repo_path}
            <LeftMenuWithRepo {repo_url} {repo_path} />
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
        justify-content: space-between;
        gap: 2rem;
        min-width: 0;
    }

    .left-menu-container {
        flex: 1;
        min-width: 5rem;
        overflow: hidden;
    }

    .user-menu-container {
        display: flex;
        align-items: center;
        min-width: 5rem;
        overflow: hidden;
    }
</style>

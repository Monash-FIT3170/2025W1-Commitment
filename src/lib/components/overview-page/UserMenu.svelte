<script lang="ts">
    import Icon from "@iconify/svelte";
    import { sidebar_open, open_sidebar } from "$lib/stores/sidebar";

    let { username, profile_image_url } = $props();
</script>

<!-- user menu: user name, avatar, and sidebar toggle button -->
<div class="user-menu">
    <h6 class="body-accent user-name">{username}</h6>
    <img src={profile_image_url} alt={username} class="profile-img" />

    <button
        class="hamburger-btn"
        onclick={open_sidebar}
        aria-expanded={$sidebar_open}
    >
        <Icon icon="tabler:menu-2" class="icon-medium" />
    </button>
</div>

<style>
    .user-menu {
        display: flex;
        align-items: center;
        height: inherit;
    }

    .user-name {
        margin-top: 0px;
        margin-bottom: 0px;
        margin-right: 0.5rem;
    }

    .profile-img {
        width: 1.375rem;
        height: 1.375rem;
        border-radius: 50%;
        object-fit: cover;
        margin-right: 0.8125rem;
    }

    .hamburger-btn {
        background: none;
        border: none;
        padding: 0.125rem;
        cursor: pointer;
        display: flex;
        color: var(--label-primary);
    }
</style>

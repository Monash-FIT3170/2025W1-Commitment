<script lang="ts">
    import Icon from "@iconify/svelte";
    import { sidebarOpen, toggleSidebar } from "$lib/stores/sidebar";

    export let userName: string;
    export let profileImageURL: string;
</script>

<!-- user menu: user name, avatar, and sidebar toggle button -->
<div class="user-menu">
    <div class="user-info">
        <h6 class="body-accent white user-name">{userName}</h6>
        <img src={profileImageURL} alt="Profile" class="profile-img" />
    </div>

    <button
        class="hamburger-btn"
        on:click={toggleSidebar}
        aria-expanded={sidebarOpen}
    >
        <Icon icon="tabler:menu-2" class="icon-medium" />
    </button>
</div>

<style>
    .user-menu {
        position: fixed;
        top: 1rem;
        right: 1rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        z-index: 200;
    }

    .user-info {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .user-name {
        font-family: "DM Sans", sans-serif;
        font-size: 0.875rem;
        font-weight: 600;
        margin: 0;
        color: var(--white);
    }

    .profile-img {
        width: 1.375rem;
        height: 1.375rem;
        border-radius: 50%;
        object-fit: cover;
    }

    .hamburger-btn {
        background: none;
        border: none;
        padding: 0.25rem;
        cursor: pointer;
        display: flex;
        color: var(--label-primary);
    }
</style>

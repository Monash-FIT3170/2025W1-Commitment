<script lang="ts">
    import Icon from "@iconify/svelte";
    import { sidebar_open, open_sidebar } from "$lib/stores/sidebar";
</script>

<!-- user menu: user name, avatar, and sidebar toggle button -->
<div class="user-menu">
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

    .hamburger-btn {
        background: none;
        border: none;
        padding: 0.125rem;
        cursor: pointer;
        display: flex;
        color: var(--label-primary);
    }
</style>

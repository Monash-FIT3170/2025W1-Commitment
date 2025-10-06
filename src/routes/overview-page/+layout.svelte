<script lang="ts">
    import { onMount } from "svelte";
    import { installGlobalDnDGuards } from "$lib/dnd_guards";
    import { info } from "@tauri-apps/plugin-log";
    import { refresh_store } from "$lib/stores/refresh";

    onMount(() => {
        const cleanup = installGlobalDnDGuards();
        info("[DnD] global guards installed");
        return cleanup;
    });

    import { page } from "$app/state";
    import Banner from "$lib/components/overview-page/Banner.svelte";
    import Sidebar from "$lib/components/global/Sidebar.svelte";
    import { load_state } from "$lib/utils/localstorage";

    let profile_image_url = "/mock_profile_img.png";
    let username = "Baaset Moslih";

    let { children } = $props();

    const s = page.state as any;
    load_state(s);
    info(`Repo URL: ${s.repo_url}`);
    let owner = $derived(s.owner);
    let repo = $derived(s.repo);
    let repo_url = $derived(s.repo_url);

    // Get refresh function and state from store
    let on_refresh = $derived($refresh_store.refresh_function);
    let refreshing = $derived($refresh_store.refreshing);
</script>

<main class="page">
    <header class="header">
        <Banner
            {repo}
            {owner}
            {repo_url}
            {username}
            {profile_image_url}
            {on_refresh}
            {refreshing}
        />
    </header>
    {@render children()}
</main>
<Sidebar />

<style>
    .header {
        padding-left: 2rem;
        padding-right: 2rem;
        padding-top: 2rem;
        margin-bottom: 0.8125rem;
        height: 1.375rem;
        display: flex;
        justify-content: space-between;
    }
</style>

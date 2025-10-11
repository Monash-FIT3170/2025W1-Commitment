<script lang="ts">
    import { onMount } from "svelte";
    import { installGlobalDnDGuards } from "$lib/dnd_guards";
    import { info } from "@tauri-apps/plugin-log";
    import { refresh_state } from "$lib/stores/refresh.svelte";

    onMount(() => {
        const cleanup = installGlobalDnDGuards();
        info("[DnD] global guards installed");
        return cleanup;
    });

    import { page } from "$app/state";
    import Banner from "$lib/components/overview-page/Banner.svelte";
    import Sidebar from "$lib/components/global/Sidebar.svelte";
    import { load_state } from "$lib/utils/localstorage";

    let profile_image_url = "";
    let username = "";

    let { children } = $props();

    const s = page.state as any;
    load_state(s);
    info(`Repo URL: ${s.repo_url}`);
    let owner = $derived(s.owner);
    let repo = $derived(s.repo);
    let repo_url = $derived(s.repo_url);

    // Get refresh and delete functions from state (using runes)
    let on_refresh = $derived(refresh_state.refresh_function ?? undefined);
    let refreshing = $derived(refresh_state.refreshing);
    let on_delete = $derived(refresh_state.delete_function ?? undefined);
</script>

<main class="page">
    <header class="header">
        <Banner
            {repo}
            {owner}
            {repo_url}
            {on_refresh}
            {refreshing}
            {on_delete}
            showBackButton={true} 
        />
    </header>
    {@render children()}
</main>
<Sidebar />

<style>
    .header {
        display: flex;
        justify-content: space-between;
    }
</style>

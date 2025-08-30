<script lang="ts">
    import { onMount } from "svelte";
    import { installGlobalDnDGuards } from "$lib/dnd_guards";

    onMount(() => {
        const cleanup = installGlobalDnDGuards();
        console.log("[DnD] global guards installed");
        return cleanup;
    });

    import { page } from "$app/state";
    import Banner from "$lib/components/overview-page/Banner.svelte";
    import ButtonFooter from "$lib/components/overview-page/ButtonFooter.svelte";
    import Sidebar from "$lib/components/global/Sidebar.svelte";

    let profile_image_url = "/mock_profile_img.png";
    let username = "Baaset Moslih";

    let { children } = $props();

    let repo_url = $derived(page.state.repo_url);
    let repo_path = $derived(page.state.repo_path);
</script>

<main class="page">
    <header class="header">
        <Banner {repo_url} {repo_path} {username} {profile_image_url} />
    </header>
    <div class="content">
        {@render children()}
    </div>
    <footer class="footer">
        <ButtonFooter />
    </footer>
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
    
    .footer {
        /* position: fixed; */
        bottom: 0;
        width: 100%;
    }

    .content {
        min-height: 100vh;
    }
</style>

<script lang="ts">
    import { page } from "$app/state";
    import Banner from "$lib/components/overview-page/Banner.svelte";
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
    {@render children()}
</main>
<Sidebar />


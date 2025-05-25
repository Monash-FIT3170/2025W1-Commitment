<script lang="ts">
    import { page }     from '$app/stores';
    import { derived }  from 'svelte/store';
    import Icon         from '@iconify/svelte';
    import Graph        from '$lib/components/overview-page/Graph.svelte';

    //import layout components
    import Banner from '$lib/components/overview-page/Banner.svelte';
    import UserMenu from '$lib/components/overview-page/UserMenu.svelte';
    import Sidebar from '$lib/components/global/sidebar.svelte';
    import ContributorGrid from '$lib/components/overview-page/ContributorGrid.svelte';
    // import Graph from '$lib/components/overiew-page/graph.svelte'

    //import functions
    import { toggleSidebar, sidebarOpen } from '$lib/stores/sidebar';
    import { onDestroy } from 'svelte';

    let open = false;
    const unsubscribe = sidebarOpen.subscribe(value => open = value);
    onDestroy(unsubscribe);

    //dummy data for demo
    let institutionName = 'Monash'
    let unitCode = 'FIT3170'
    let repoName = '2025W1-Commitment';
    $: repoUrl = `https://github.com/${institutionName}/${unitCode}/${repoName}`;

    let profileImageURL = '/mock_profile_img.png';
    let userName = 'Baaset Moslih';


</script>
<div class="page">
    <!-- fixed -->
    <div class="header">
        <Banner {repoUrl}/>
        <UserMenu {userName} {profileImageURL}/>
        <Sidebar />
    </div>

    <!-- scrollable content -->
    <div class="main">
        <slot />
        Graph goes here!<br><br><br><br><br><br><br><br>
        {#each Array(50) as _}
        <p>Filler content to test background scrolling</p>
        {/each}

        <section class="contributors-section">
            <div class="heading-1">Our Contributors</div>
            <ContributorGrid />
        </section>
    </div>
</div>

<style>

.header {
    position: fixed;
    top: 0;
    left: 0;
    width: 90%;
    z-index: 1000;
    background: inherit;
    backdrop-filter: blur(6px);
    padding: 5rem;
}

.main {
    padding: 12rem 2rem 2rem;
    color: white;
    background: transparent;
}
</style>
<script lang="ts">
    import { page }     from '$app/stores';
    import { derived }  from 'svelte/store';
    import Icon         from '@iconify/svelte';

    //import layout components
    import Banner from '$lib/components/overview-page/banner.svelte';
    import UserMenu from '$lib/components/overview-page/user-menu.svelte';
    import Sidebar from '$lib/components/global/sidebar.svelte';
    import ContributorGrid from '$lib/components/overview-page/contibutor-grid.svelte';
    import PageHeading from "$lib/components/overview-page/page-heading.svelte"
    import Graph from '$lib/components/overview-page/Graph.svelte'

    //import functions
    import { toggleSidebar, sidebarOpen } from '$lib/stores/sidebar';
    import { onDestroy } from 'svelte';

    let open = false;
    const unsubscribe = sidebarOpen.subscribe(value => open = value);
    onDestroy(unsubscribe);

    //dummy data for demo
    let repoType = 'github'
    let institutionName = 'Monash'
    let unitCode = 'FIT3170'
    let repoName = '2025W1-Commitment';
    $: repoPath = `/${institutionName}/${unitCode}/${repoName}`;

    let profileImageURL = '/mock_profile_img.png';
    let userName = 'Baaset Moslih';


</script>
<div class="page">
    <!-- fixed -->
    <div class="header">
        <div class="left-container">
            <Banner {repoPath}/>
            <PageHeading {repoName} {repoType}/>
        </div>
        <div class="right-container">
            <UserMenu {userName} {profileImageURL} />
            <Sidebar />
        </div>
    </div>

    <!-- scrollable content -->
    <div class="body">
        <slot />
        Graph goes here!<br><br><br><br><br><br><br><br>
        

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
    width: 100%;
    max-width: 2500px;
    z-index: 1000;
    background: inherit;
    backdrop-filter: blur(6px);
    padding: 2rem;
    align-items: flex-start;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
}

.main {
    padding: 12rem 2rem 2rem;
    color: white;
    background: transparent;
}
</style>
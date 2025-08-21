<script lang="ts">
    import Icon from "@iconify/svelte";
    import {
        load_branches,
        load_commit_data,
        type Contributor,
    } from "$lib/metrics";
    import Graph from "$lib/components/overview-page/Graph.svelte";
    import ContributorCards from "$lib/components/overview-page/ContributorCards.svelte";
    import { info } from "@tauri-apps/plugin-log";
    import { page } from "$app/stores"; // Import the $page store
    import DropdownTintedMedium from "$lib/components/global/dropdown-tinted-medium.svelte"
    import { createDropdownSelection } from "$lib/stores/dropdown";
    import ButtonTintedMedium from "../global/button-tinted-medium.svelte";

    // Initialize from $page.state
    let contributors: Contributor[] = $state(($page.state as any).commitData || []);
    // let branches: string[] = $state(($page.state as any).branches || []);
    // let selected_branch = $state("all");
    // if (branches.length > 0 && !branches.includes(selected_branch)) {
    //     selected_branch = "all";
    // }

    let criteria = ["total commits", "lines of code", "lines/commit"];
    let selectedCriteria = criteria[0];

    let sidebar_open = $state(false);
    let bookmarked_repo: { repo_name: string; repo_url: string }[] = [];

    function toggleSidebar() {
        sidebar_open = !sidebar_open;
    }
</script>

<main class="container">

    <div class="header-row">
        <!-- Removed branch select dropdown -->

        <!-- faking the dropdown button -->
        <ButtonTintedMedium
            label="commits"
            labelClass="body"
            iconFirst={false}
            icon="chevron-down"
            width=12rem
        />

        <ButtonTintedMedium
            label="mean"
            labelClass="body"
            iconFirst={false}
            icon="chevron-down"
            width=12rem
        />

    </div>

    <Graph {contributors} />
    <ContributorCards users={contributors} />
</main>

<!-- Sidebar -->
<div class={`sidebar ${sidebar_open ? "open" : "closed"}`}>
    <div class="sidebar-header">
        <div class="sidebar-title">
            <Icon
                icon={"tabler:chart-line"}
                class="icon-large"
                style="color: white"
            />
            <h1 class="title sidebar-title-text white">settings</h1>
        </div>
        <button class="close-button" onclick={toggleSidebar}>
            <Icon icon={"tabler:x"} class="icon-medium" style="color: white" />
        </button>
    </div>

    <div class="bookmark-list">
        <div class="bookmark-header">
            <Icon
                icon={"tabler:star-filled"}
                class="icon-medium"
                style="color: white"
            />
            <h2 class="heading-1 bookmark-text white">bookmarks</h2>
        </div>

        {#each bookmarked_repo as repo (repo.repo_url)}
            <button class="bookmark-item">
                <h6 class="heading-2 repo-name label-secondary">
                    {repo.repo_name}
                </h6>
                <h6 class="caption repo-url label-secondary">
                    {repo.repo_url}
                </h6>
            </button>
        {/each}
    </div>
</div>

<style>
    .container {
        /* margin: 2rem;
        margin-right: 2rem; */
        padding: 2rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        min-height: auto;
    }

    .title {
        font-size: 2rem;
        font-weight: bold;
        margin-bottom: 2rem;
        color: #f6f6f6;
    }

    .header-row {
        width: 100%;
        display: flex;
        justify-content: flex-end;
        flex-direction: row;
        align-items: end;
        margin-bottom: 2rem;
        padding: 1rem;
        
    }

    .branch-select {
        background-color: #333;
        color: #f6f6f6;
        border: 1px solid #444;
        border-radius: 6px;
        padding: 8px 12px;
        font-size: 14px;
        cursor: pointer;
        outline: none;
        transition: border-color 0.2s;
    }

    .branch-select:hover {
        border-color: #666;
    }

    .branch-select:focus {
        border-color: #888;
    }

    /* Sidebar styles */
    .sidebar {
        position: fixed;
        top: 0;
        right: 0;
        width: 18.4375rem;
        height: 100%;
        padding: 2rem;
        border-radius: 8px 0px 0px 8px;
        border-top: solid var(--Label-Tertiary, #747474);
        border-bottom: solid var(--Label-Tertiary, #747474);
        border-left: solid var(--Label-Tertiary, #747474);
        border-width: 0.0625rem;
        background: var(--Background-Tint, rgba(34, 34, 34, 0.7));
        backdrop-filter: blur(16px);
        box-shadow: 0 10px 15px rgba(0, 0, 0, 0.3);
        z-index: 50;
        transform: translateX(100%);
        transition: transform 0.5s ease-in-out;
    }

    .sidebar.open {
        transform: translateX(0);
    }

    .sidebar.closed {
        transform: translateX(100%);
    }

    .sidebar-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        height: 1.8125rem;
        margin-bottom: 1.5rem;
    }

    .sidebar-title {
        display: flex;
        height: 29px;
    }

    .sidebar-title-text {
        margin: auto;
        margin-left: 0.375rem;
        height: 1.8125rem;
    }

    .close-button {
        cursor: pointer;
        background: none;
        border: none;
        padding: 0;
    }

    .bookmark-list {
        display: grid;
        grid-template-columns: 1fr;
        gap: 13px;
    }

    .bookmark-header {
        display: flex;
        align-items: center;
        height: 22px;
    }

    .bookmark-text {
        padding-left: 6px;
    }

    .bookmark-item {
        display: flex;
        flex-direction: column;
        text-align: left;
        cursor: pointer;
        background: none;
        border: none;
        padding: 0;
    }

    .repo-name,
    .repo-url {
        margin-top: 0px;
        margin-bottom: 0px;
    }

    .white {
        color: var(--white);
    }

    .label-secondary {
        color: var(--label-secondary);
    }
</style>

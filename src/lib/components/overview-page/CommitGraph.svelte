<script lang="ts">
    import Graph from "$lib/components/overview-page/Graph.svelte";
    import ContributorCards from "$lib/components/overview-page/ContributorCards.svelte";
    import { info } from "@tauri-apps/plugin-log";
    import { page } from "$app/stores"; // Import the $page store
    import DropdownTintedMedium from "$lib/components/global/dropdown-tinted-medium.svelte"
    import { createDropdownSelection } from "$lib/stores/dropdown";
    import ButtonTintedMedium from "../global/button-tinted-medium.svelte";
    import { writable } from "svelte/store";

    // Initialize from $page.state
    let contributors: Contributor[] = $state(($page.state as any).commitData || []);
    // let branches: string[] = $state(($page.state as any).branches || []);
    // let selected_branch = $state("all");
    // if (branches.length > 0 && !branches.includes(selected_branch)) {
    //     selected_branch = "all";
    // }

    let criteria: string[] = ["commits", "commit_size"];
    let selectedCriteria = $state(writable(criteria[0]));

    let sidebar_open = $state(false);
    let bookmarked_repo: { repo_name: string; repo_url: string }[] = [];

    function toggleSidebar() {
        sidebar_open = !sidebar_open;
    }

    import type { Contributor } from "$lib/metrics";

    let {
        contributors,
        branches,
    }: { contributors: Contributor[]; branches: String[] } = $props();
</script>

<main class="container">
    <div class="header-row">
        <!-- Removed branch select dropdown -->


        <DropdownTintedMedium
            options={criteria}
            bind:selected={selectedCriteria}
        />

        <ButtonTintedMedium
            label="mean"
            label_class="body"
            icon_first={false}
            icon="chevron-down"
            width="12rem"
        />

    </div>
<<<<<<< HEAD
    <Graph {contributors} />
    <ContributorCards users={contributors} selected_branch={""} />
=======

    <Graph contributors={contributors} metric={$selectedCriteria} />
    <ContributorCards users={contributors} />
>>>>>>> 4fc209e (wip: Refactoring existing code to work with multiple metrics)
</main>

<style>
    .container {
        padding: 2rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        min-height: auto;
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
</style>

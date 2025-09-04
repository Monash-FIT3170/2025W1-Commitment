<script lang="ts">
    import Graph from "$lib/components/overview-page/Graph.svelte";
    import ContributorCards from "$lib/components/overview-page/ContributorCards.svelte";
    import DropdownTintedMedium from "$lib/components/global/DropdownTintedMedium.svelte";
    import ButtonTintedMedium from "../global/ButtonTintedMedium.svelte";
    import type { Contributor } from "$lib/metrics";

    let {
        contributors,
        branches,
        selected_branch,
        start_date,
        end_date,
        criteria,
        selected_criteria = $bindable(),
    }: {
        contributors: Contributor[];
        branches: String[];
        selected_branch?: string;
        start_date?: string;
        end_date?: string;
        criteria: string[];
        selected_criteria: string;
    } = $props();

    let sidebar_open = $state(false);
    let bookmarked_repo: { repo_name: string; repo_url: string }[] = [];

    function toggle_sidebar() {
        sidebar_open = !sidebar_open;
    }
</script>

<main class="container">
    <div class="header-row">
        <DropdownTintedMedium
            options={criteria}
            bind:selected={selected_criteria}
            disabled={false}
        />

        <ButtonTintedMedium
            label="mean"
            label_class="body"
            icon_first={false}
            icon="chevron-down"
            width="12rem"
        />
    </div>
    <Graph
        {contributors}
        {selected_branch}
        {start_date}
        {end_date}
        metric={selected_criteria}
    />
    <ContributorCards
        users={contributors}
        selected_branch={selected_branch ?? ""}
        start_date={start_date ?? ""}
        end_date={end_date ?? ""}
        metric={selected_criteria}
    />
</main>

<style>
    .container {
        padding: 0rem 2rem;
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

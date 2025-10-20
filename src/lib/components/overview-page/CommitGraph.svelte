<script lang="ts">
    import Graph from "$lib/components/overview-page/Graph.svelte";
    import ContributorCards from "$lib/components/overview-page/ContributorCards.svelte";
    import DropdownTintedMedium from "$lib/components/global/DropdownTintedMedium.svelte";
    import Icon from "@iconify/svelte";
    import type { Contributor } from "$lib/metrics";

    let {
        contributors,
        branches,
        selected_branch,
        start_date,
        end_date,
        criteria,
        selected_criteria = $bindable(),
        aggregation_options,
        selected_aggregation = $bindable(),
    }: {
        contributors: Contributor[];
        branches: String[];
        selected_branch?: string;
        start_date?: string;
        end_date?: string;
        criteria: string[];
        selected_criteria: string;
        aggregation_options: string[];
        selected_aggregation: string;
    } = $props();

    let sidebar_open = $state(false);
    let bookmarked_repo: { repo_name: string; repo_url: string }[] = [];
    let graph_component: {
        toggle_chart_expansion: () => void;
    } | null = null;
    let is_graph_expanded = $state(false);
    let is_graph_transitioning = $state(false);

    function toggle_sidebar() {
        sidebar_open = !sidebar_open;
    }
</script>

<main class="container">
    <div class="header-row">
        <button
            type="button"
            class="graph-toggle-button"
            class:expanded={is_graph_expanded}
            onclick={() => graph_component?.toggle_chart_expansion()}
            disabled={is_graph_transitioning}
            aria-label={is_graph_expanded ? "Shrink graph" : "Expand graph"}
            title={is_graph_expanded ? "Shrink graph" : "Expand graph"}
        >
            <Icon
                icon={`tabler:${is_graph_expanded
                    ? "layout-navbar-collapse"
                    : "layout-navbar-expand"}`}
                class="icon-medium"
                style="color: currentColor"
            />
        </button>
        <DropdownTintedMedium
            options={criteria}
            bind:selected={selected_criteria}
            disabled={false}
        />

        <DropdownTintedMedium
            options={aggregation_options}
            bind:selected={selected_aggregation}
            disabled={false}
        />
    </div>
    <Graph
        bind:this={graph_component}
        bind:is_expanded={is_graph_expanded}
        bind:is_transitioning={is_graph_transitioning}
        {contributors}
        {selected_branch}
        {start_date}
        {end_date}
        metric={selected_criteria}
        aggregation={selected_aggregation}
    />

    <ContributorCards
        users={contributors}
        selected_branch={selected_branch ?? ""}
        start_date={start_date ?? ""}
        end_date={end_date ?? ""}
        metric={selected_criteria}
        aggregation={selected_aggregation}
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
        align-items: center;
        margin-bottom: 2rem;
        padding: 1rem;
        gap: 1rem;
    }

    .graph-toggle-button {
        all: unset;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
        padding: 0.5rem 1.2rem;
        border-radius: 8px;
        cursor: pointer;
        transition: background-color 0.2s ease, color 0.2s ease;
        background-color: var(--tint-00);
        color: var(--label-primary);
    }

    .graph-toggle-button:hover,
    .graph-toggle-button:focus {
        background-color: var(--tint-01);
    }

    .graph-toggle-button:active {
        background-color: var(--tint-02);
    }

    .graph-toggle-button:disabled {
        background-color: var(--tint-00);
        color: var(--label-secondary);
        cursor: not-allowed;
    }

    .graph-toggle-button.expanded {
        background-color: var(--fill-01);
        color: var(--background-primary);
    }

    .graph-toggle-button.expanded:hover,
    .graph-toggle-button.expanded:focus {
        background-color: var(--fill-03);
        color: var(--background-tertiary);
    }

    .graph-toggle-button.expanded:active {
        background-color: var(--fill-00);
    }

    .graph-toggle-button.expanded:disabled {
        background-color: var(--fill-04);
        color: var(--background-tertiary);
    }
</style>

<script lang="ts">
    import Graph from "$lib/components/overview-page/Graph.svelte";
    import ContributorCards from "$lib/components/overview-page/ContributorCards.svelte";
    import ButtonTintedMedium from "../global/ButtonTintedMedium.svelte";
    import type { Contributor } from "$lib/metrics";

    let {
        contributors,
        branches,
    }: { contributors: Contributor[]; branches: String[] } = $props();
</script>

<main class="container">
    <div class="header-row">
        <!-- faking the dropdown button -->
        <ButtonTintedMedium
            label="commits"
            label_class="body"
            icon_first={false}
            icon="chevron-down"
            width="12rem"
        />

        <ButtonTintedMedium
            label="mean"
            label_class="body"
            icon_first={false}
            icon="chevron-down"
            width="12rem"
        />
    </div>
    <Graph {contributors} />
    <ContributorCards users={contributors} selected_branch={""} />
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

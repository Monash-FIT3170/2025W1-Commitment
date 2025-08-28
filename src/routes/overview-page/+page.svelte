<script lang="ts">
    import ButtonPrimaryMedium from "$lib/components/global/ButtonPrimaryMedium.svelte";
    import CommitGraph from "$lib/components/overview-page/CommitGraph.svelte";
    import ContributorAnalysis from "$lib/components/overview-page/ContributorAnalysis.svelte";
    import Heading from "$lib/components/overview-page/Heading.svelte";
    import { page } from "$app/state";
    import Tab from "$lib/components/global/Tab.svelte";

    let repo_path = $derived(page.state.repo_path);
    let repo_type = $derived(page.state.repo_type);
    let branches = $state(page.state.branches);
    let contributors = $derived(page.state.contributors);

    let selected_view: string = $state("overview");

    const tabs = [
        { id: "overview", label: "Overview", icon: "chart-line" },
        { id: "analysis", label: "Contribution Analysis", icon: "id" },
    ];

    function select_view(id: string) {
        selected_view = id;
        console.log(selected_view);
    }
</script>

<div class="main">
    <Heading repo_path={repo_path.split("/").pop() || repo_path} {repo_type} />

    <div class="page-select-btns">
        <!-- for each tab -->
        {#each tabs as tab}
            <Tab
                label={tab.label}
                icon={tab.icon}
                selected={selected_view === tab.id}
                width="100%"
                onclick={() => select_view(tab.id)}
            />
        {/each}
    </div>

    <!-- commit graph -->
    {#if selected_view === "overview"}
        <CommitGraph {contributors} {branches} />
    {:else if selected_view === "analysis"}
        <ContributorAnalysis {contributors} />
    {/if}
    <div class="bottom-container">
        <ButtonPrimaryMedium icon="table-import" label="Upload Marking Sheet" />

        <ButtonPrimaryMedium
            icon="file-download"
            label="Download Marking Sheet"
        />
    </div>
</div>

<style>
    .bottom-container {
        flex-direction: row;
        display: flex;
        align-items: center;
        justify-content: center;
        padding-top: 2rem;
        padding-bottom: 6rem;
        gap: 1rem;
    }
    .page-select-btns {
        display: grid;
        grid-template-columns: 20rem 20rem;
        column-gap: 1rem;
        padding-top: 2rem;
        z-index: 1;
        padding: 0rem 4rem;
    }

    @media (max-width: 75rem) {
        .page-select-btns {
            grid-template-columns: 16rem 16rem;
            padding-top: 4rem;
        }
    }
</style>

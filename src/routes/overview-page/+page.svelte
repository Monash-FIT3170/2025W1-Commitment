<script>
    import { page } from "$app/state";
    import Heading from "$lib/components/overview-page/Heading.svelte";
    import CommitGraph from "$lib/components/overview-page/CommitGraph.svelte";
    import ButtonPrimaryMedium from "$lib/components/global/ButtonPrimaryMedium.svelte";

    let repo_path = $derived(page.state.repo_path);
    let repo_type = $derived(page.state.repo_type);
    let branches = $state(page.state.branches);
    let contributors = $derived(page.state.contributors);
</script>

<div class="main">
    <Heading repo_path={repo_path.split("/").pop() || repo_path} {repo_type} />
    <CommitGraph {contributors} {branches} />
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
</style>

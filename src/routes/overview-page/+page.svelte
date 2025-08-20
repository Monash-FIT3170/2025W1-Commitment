<script>
    import { page } from "$app/state";
    import Heading from "$lib/components/overview-page/Heading.svelte";
    import CommitGraph from "$lib/components/overview-page/CommitGraph.svelte";
    import ButtonPrimaryMedium from "$lib/components/global/ButtonPrimaryMedium.svelte";
  import { load_branches, load_commit_data } from "$lib/metrics";

    let repo_type = $state(page.state.repo_type);
    let branches = $state(page.state.branches || []);
    let contributors = $state(page.state.contributors || []);
    let owner = $state(page.state.owner || "");
    let repo = $state(page.state.repo || "");
    let branch_selection = $state("");
    $effect(() => {
        if (branch_selection && owner && repo && repo_type) {
            // Fetch new contributors for the selected branch
            (async () => {
                const newContributors = await load_commit_data(
                    owner,
                    repo,
                    repo_type,
                    branch_selection
                );
                contributors = [...newContributors];
            })();
        }
    });
$effect(() => {
    if ((!branches || branches.length === 0) && repo) {
        // Fetch branches for the repository
        (async () => {
            branches = await load_branches(repo);
        })();
    }
});
    
</script>

<div class="page">
    <Heading repo={repo} {repo_type} {branches} bind:branch_selection />
    <CommitGraph {contributors} {branches} selected_branch={branch_selection}/>
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

<script>
    import { page } from "$app/state";
    import Heading from "$lib/components/overview-page/Heading.svelte";
    import CommitGraph from "$lib/components/overview-page/CommitGraph.svelte";
    import ButtonPrimaryMedium from "$lib/components/global/ButtonPrimaryMedium.svelte";
    import { load_branches, load_commit_data } from "$lib/metrics";

    let repo_path = $state(page.state.repo_path || "");
    let repo_type = $state(page.state.repo_type || "");
    let branches = $state(page.state.branches || []);
    let contributors = $state(page.state.contributors || []);
    let branch_selection = $state("");
    let start_date = $state("");
    let end_date = $state("");

    $effect(() => {
        if (
            (branch_selection && branch_selection !== "") ||
            (start_date && end_date)
        ) {
            // Fetch new contributors for the selected branch
            (async () => {
                const branch_arg =
                    branch_selection === "" ? undefined : branch_selection;
                const new_contributors = await load_commit_data(
                    owner,
                    repo,
                    repo_type,
                    branch_arg,
                    start_date,
                    end_date
                );

                console.log("New Contributors:", new_contributors);
                contributors = [...new_contributors];
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
    <Heading
        {repo}
        {repo_type}
        {branches}
        bind:branch_selection
        bind:start_date
        bind:end_date
    />
    <CommitGraph
        {contributors}
        {branches}
        selected_branch={branch_selection}
        {start_date}
        {end_date}
    />
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

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
    let source_type = $state(page.state.source_type);
    //let branch_selection = $bindable($state("#"));
    $effect(() => {
        console.log("EFFECT: branch_selection is", source_type);
        if (source_type && repo_path) {
            // Fetch new contributors for the selected branch
            (async () => {
                console.log(
                    "Calling load_commit_data with:",
                    repo_path,
                    source_type
                );
                const newContributors = await load_commit_data(
                    repo_path.split("/")[0],
                    repo_path.split("/")[1],
                    source_type
                );
                contributors = [...newContributors];
            })();
        }
    });
    $effect(() => {
        if ((!branches || branches.length === 0) && repo_path) {
            // You may need to adjust this to match your load_branches signature
            (async () => {
                branches = await load_branches(repo_path.split("/")[1]);
                console.log("Fetched branches:", branches);
            })();
        }
    });
    $effect(() => {
        console.log("Page branch_selection", page.state.selected_branch);
    });
    $effect(() => {
        console.log("Branches in +page.svelte:", branches);
    });
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

<script>
    import Heading from "$lib/components/overview-page/Heading.svelte";
    import CommitGraph from "$lib/components/overview-page/CommitGraph.svelte";
    import { currentRepo } from "$lib/stores/repo";
</script>


<Heading repoPath={$currentRepo.repoPath.split("/").pop() || $currentRepo.repoPath} repoType={$currentRepo.repoType} />
<CommitGraph />
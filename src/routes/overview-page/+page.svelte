<script>
    import Heading from "$lib/components/overview-page/Heading.svelte";
    import CommitGraph from "$lib/components/overview-page/CommitGraph.svelte";
    import { currentRepo } from "$lib/stores/repo";
    import ButtonPrimaryMedium from "$lib/components/global/button-primary-medium.svelte";
</script>

<div class="page">
    <Heading repoPath={$currentRepo.repoPath.split("/").pop() || $currentRepo.repoPath} repoType={$currentRepo.repoType} />
    <CommitGraph />
    <div class="bottom-container">
        <ButtonPrimaryMedium
            icon="table-import"
            label="Upload Marking Sheet"
        />

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
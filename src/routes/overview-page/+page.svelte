<script lang="ts">
    import { page } from "$app/state";
    import Heading from "$lib/components/overview-page/Heading.svelte";
    import CommitGraph from "$lib/components/overview-page/CommitGraph.svelte";
    import ButtonPrimaryMedium from "$lib/components/global/ButtonPrimaryMedium.svelte";
    import UploadFileModal from  "$lib/components/overview-page/UploadFileModal.svelte";

    import { uploadedGradingFile, type GradingFile } from "$lib/stores/gradingFile";


    let repo_path = $derived(page.state.repo_path);
    let repo_type = $derived(page.state.repo_type);
    let branches = $state(page.state.branches);
    let contributors = $derived(page.state.contributors);

    let showModal = $state(false);
    const openModal = () => ( showModal = true); 
    let pickedName = $state<string | null>(null);



    async function handleSelect(file: File) {

        // read file into memory
        const buf = await file.arrayBuffer();
        const bytes = new Uint8Array(buf);

        const gf: GradingFile = {
            name: file.name,
            size: file.size,
            mime: file.type || null,
            bytes
        };
        uploadedGradingFile.set(gf);

        pickedName = file.name;
        // showModal = false;
        console.info("[upload] stored file in memory:", {name: file.name, size: file.size})
    }

</script>

<div class="main">
    <Heading repo_path={repo_path.split("/").pop() || repo_path} {repo_type} />
    <CommitGraph {contributors} {branches} />
    <div class="bottom-container">
        <ButtonPrimaryMedium 
            icon="table-import" 
            label="Upload Marking Sheet" 
            onclick={openModal}
        />

        <ButtonPrimaryMedium
            icon="file-download"
            label="Download Marking Sheet"
        />
    </div>
    <UploadFileModal bind:showModal onselect={handleSelect} />
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

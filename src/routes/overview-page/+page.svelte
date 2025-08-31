<script lang="ts">
    import { page } from "$app/state";
    import Heading from "$lib/components/overview-page/Heading.svelte";
    import CommitGraph from "$lib/components/overview-page/CommitGraph.svelte";
    import ButtonPrimaryMedium from "$lib/components/global/ButtonPrimaryMedium.svelte";
    import UploadFileModal from  "$lib/components/overview-page/UploadFileModal.svelte";

    import { downloadPopulatedFile } from "$lib/utils/grading";
    import { uploadedGradingFile } from "$lib/stores/gradingFile";
    import { readHeaders, validateHeaders } from "$lib/utils/csv";


    let repo_path = $derived(page.state.repo_path);
    let repo_type = $derived(page.state.repo_type);
    let branches = $state(page.state.branches);
    let contributors = $derived(page.state.contributors);

    let showModal = $state(false);
    const openModal = () => ( showModal = true); 
    let pickedName = $state<string | null>(null);
    let currentUpload = $state(null as ReturnType<typeof uploadedGradingFile["get"]> | null);

    
    $effect(() => {
        const unsub = uploadedGradingFile.subscribe((v) => {
        currentUpload = v;
        console.log("[upload store] now:", v?.name, {
            hasBytes: !!v?.bytes?.length,
            valid: v?.valid,
            missing: v?.missing,
        });
        });
        return () => unsub();
    });



    async function handleSelect(file: File) {

        // read file into memory
        const bytes = new Uint8Array(await file.arrayBuffer());
        const { headers, delimiter } = readHeaders(bytes);
        const { ok, missing } = validateHeaders(headers);

        uploadedGradingFile.set({
            name: file.name,
            size: file.size,
            mime: file.type || "text/plain",
            bytes,
            headers,
            delimiter,
            valid: ok,
            missing

        });

        pickedName = file.name;
        console.log("[upload] headers:", headers);
        console.log("[upload] delimiter:", delimiter);
        console.log("[upload] valid:", ok, ok ? "" : `missing => ${missing.join(", ")}`);
    }

    async function handleDownload() {
        if (!contributors || !contributors.length) {
            console.warn("[download] no contributors on page");
            return;
        }
        if (!currentUpload) {
            console.warn("[download] no uploaded file in memory");
            return;
        }
        try {
            await downloadPopulatedFile(contributors, currentUpload);
            console.log("[download] complete");
        } catch (err) {
            console.error("[download] failed:", err);
        }
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
            onclick={handleDownload}
            disabled={!$uploadedGradingFile || !$uploadedGradingFile.valid}
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

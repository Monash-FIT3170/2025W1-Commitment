<script lang="ts">
    import Modal from "$lib/components/overview-page/Modal.svelte";

    let { showModal = $bindable(false), onselect = undefined } = $props();

    let dragActive = $state(false)
    let errorMsg = $state<string | null>(null);
    
    const exts = [".csv", ".tsv", ".tab", ".txt"];
    const isAllowed = (name: string) => exts.some(e => name.toLowerCase().endsWith(e));

    let fileInput: HTMLInputElement | null = null;

    function pickFile() {
        errorMsg = null;
        fileInput?.click();
    }

    function handlePicked(files: FileList | null) {
        errorMsg = null;
        const file = files?.[0];
        if (!file) return;

        if (!isAllowed(file.name)) {
        errorMsg = `Unsupported file type. Allowed: ${exts.join(", ")}`;
        return;
        }
        onselect?.(file);
    }

    function onDrop(e: DragEvent) {
        e.preventDefault();
        e.stopPropagation();
        dragActive = false;
        errorMsg = null;

        const file = e.dataTransfer?.files?.[0]
        if (!file) return;

        if (!isAllowed(file.name)) {
            errorMsg = 'Unsupported file type. Allowed ${exts.joiin(", ")}';
        }
        onselect?.(file);
    }

    const onDragOver = (e: DragEvent) => { e.preventDefault(); dragActive = true; };
    const onDragLeave = (e: DragEvent) => { e.preventDefault(); dragActive = false; };

</script>

<Modal bind:showModal>
    <div slot="header">
        <h2 class="title">Upload grading sheet</h2>
    </div>


    <div slot="body"
        class={`dropzone ${dragActive ? "active" : ""}`}
        ondragover={onDragOver}
        ondragleave={onDragLeave}
        ondrop={onDrop}
    >
        <p><strong>Drag & drop</strong> a file here</p>
        <p class="dim">Accepted: {exts.join(", ")}</p>
    </div>

    <div class="actions">
        <input
        bind:this={fileInput}
        type="file"
        accept=".csv,.tsv,.tab,.txt,text/csv,text/tab-separated-values"
        class="hidden-input"
        onchange={(e) => handlePicked((e.currentTarget as HTMLInputElement).files)}
        />
        <button class="primary" onclick={pickFile}>Browse files</button>
        <button class="ghost" onclick={() => (showModal = false)}>Cancel</button>
    </div>

    {#if errorMsg}
        <div class="error">{errorMsg}</div>
    {/if}
</Modal>
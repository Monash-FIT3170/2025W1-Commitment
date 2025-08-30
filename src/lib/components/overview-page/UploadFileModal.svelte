<script lang="ts">
    import Modal from "$lib/components/overview-page/Modal.svelte";
    import Icon from "@iconify/svelte";
    import ButtonPrimaryMedium from "$lib/components/global/ButtonPrimaryMedium.svelte";
    import ButtonTintedMedium from "$lib/components/global/ButtonTintedMedium.svelte"

    let { showModal = $bindable(false), onselect = undefined } = $props();

    // --- State ---
    let errorMsg = $state<string | null>(null);
    const exts = [".csv", ".tsv", ".tab", ".txt"];
    const isAllowed = (name: string) => exts.some(e => name.toLowerCase().endsWith(e));

    const fmtBytes = (b: number) =>
        b < 1024 
        ? `${b} B` 
        : b < 1024 ** 2 
        ? `${(b / 1024).toFixed(1)} KB` 
        : `${(b / 1024 ** 2).toFixed(1)} MB`;

    let fileInput: HTMLInputElement | null = null;

    let pickedName = $state<string | null>(null);
    let pickedSize = $state<number | null>(null);
    let pickedIcon = $state<string | null>(null);

    let dragDepth = $state(0);
    let dragActive = $state(false);


    // --- Drag event listeners --- 
    function onDragEnter(e: DragEvent) { 
        e.preventDefault(); 
        dragDepth += 1; 
        dragActive = true; 
    }
    function onDragOver(e: DragEvent)  { 
        e.preventDefault(); /* keeps drop enabled */ 
    }
    function onDragLeave(e: DragEvent) { 
        e.preventDefault(); 
        dragDepth = Math.max(0, dragDepth - 1); 
        if (dragDepth === 0) 
            dragActive = false; 
    }

    function iconFor(name: string) {
        const lower = name.toLowerCase();
        if (lower.endsWith(".csv")) return "tabler:file-type-csv";
        if (lower.endsWith(".tsv") || lower.endsWith(".tab")) return "tabler:file-type-txt"; // closest tabler icon
        if (lower.endsWith(".txt")) return "tabler:file-description";
        return "tabler:file";
    }

    function pickFile() {
        errorMsg = null;
        fileInput?.click();
    }

    function setPicked(file: File) {
        pickedName = file.name;
        pickedSize = file.size ?? null;
        pickedIcon = iconFor(file.name);
        onselect?.(file);
    }

    function clearPicked() {
        pickedName = null;
        pickedSize = null;
        pickedIcon = null;
        if (fileInput) fileInput.value = "";
    }

    function handlePicked(files: FileList | null) {
        errorMsg = null;
        const file = files?.[0];
        if (!file) return;

        if (!isAllowed(file.name)) {
            errorMsg = `Unsupported file type. Allowed: ${exts.join(", ")}`;
            return;
        }
        setPicked(file);
    }

    function onDrop(e: DragEvent) {
        e.preventDefault();
        dragActive = false; 
        dragDepth = 0;
        const file = e.dataTransfer?.files?.[0];
        if (!file) return;

        if (!isAllowed(file.name)) {
            errorMsg = `Unsupported file type. Allowed: ${exts.join(", ")}`;
            return;
        }
        setPicked(file);
    }


</script>

<Modal bind:showModal>
    {#snippet header()}
        <h2 class="title label-primary">Upload grading sheet</h2>
    {/snippet}

    {#snippet body()}
        <div
            class={`dropzone ${dragActive ? "active" : ""}`}
            ondragenter={onDragEnter}
            ondragover={onDragOver}
            ondragleave={onDragLeave}
            ondrop={onDrop}
            onclick={pickFile}
            tabindex="0"
            role="button"
            aria-label="Upload grading sheet"
            onkeydown={(e) => {
                if (e.key === "Enter" || e.key === " ") { 
                    e.preventDefault(); pickFile(); 
                }
            }}
        >
            {#if pickedName}
                <div class="dz-picked-row">
                    <div class="dz-picked-left">
                        {#if pickedIcon}
                            <Icon icon={pickedIcon} class="dz-picked-icon" />
                        {:else}
                            <Icon icon="tabler:file" class="dz-picked-icon" />
                        {/if}

                        <div class="dz-picked-meta">
                            <div class="dz-picked-name body-accent">{pickedName}</div>
                        {#if pickedSize !== null}
                            <div class="dz-picked-size caption">{fmtBytes(pickedSize)}</div>
                        {/if}
                        
                        </div>
                    </div>
                    <button class="dz-clear" onclick={clearPicked} aria-label="Clear file">✕</button>
                </div>
            {:else}
                <Icon icon="tabler:upload" class="dz-icon" />
                <p class="body-accent dz-title"><strong>Click To Select Your File</strong></p>
                <p class="caption dz-accept">Accepted: {exts.join(", ")}</p>
            {/if}
        </div>

        <div class="actions">
        <input
            bind:this={fileInput}
            type="file"
            accept=".csv,.tsv,.tab,.txt,text/csv,text/tab-separated-values"
            class="hidden-input"
            onchange={(e) => handlePicked((e.currentTarget as HTMLInputElement).files)}
        />
        <ButtonPrimaryMedium
            icon="folder-open"
            label={pickedName ? "Choose a different file" : "Browse files"}
            onclick={pickFile}
        />
        <ButtonTintedMedium
          label="Cancel"
          onclick={() => (showModal = false)}
          width="8%"
        />
        </div>

        {#if pickedName}
        <div class="chip">
            <Icon icon="tabler:file" class="chip-ico" />
            <span class="chip-name body-accent">{pickedName}</span>
            {#if pickedSize !== null}
                <span class="chip-size caption">({fmtBytes(pickedSize)})</span>
            {/if}
            <button class="chip-x body-accent" aria-label="Clear selected file" onclick={clearPicked}>✕</button>
        </div>
        {/if}

        {#if errorMsg}
        <div class="error err-banner caption">
            <Icon icon="tabler:alert-circle" class="err-ico" />
            {errorMsg}
        </div>
        {/if}
    {/snippet}
</Modal>


<style>
.title { margin: 0; }

.dropzone {
    user-select: none;
    border: 2px dashed var(--fill-03);
    border-radius: 14px;
    padding: 28px 20px;
    text-align: center;
    color: #eaeaea;
    background: linear-gradient(180deg, var(--background-secondary) 0%, var(--background-primary) 100%);
    transition: border-color 120ms ease, background 120ms ease, transform 80ms ease;
    outline: none;
    margin-bottom: 12px;
    pointer-events: auto;  /* ensure it can receive events */
    min-height: 140px;     /* generous target area */
    gap: 0.5 rem;
    text-align: center;
}
.dropzone:hover { 
    border-color: var(--pastel-wonderland--77ccf6);
    background: var(--background-tertiary);
}
.dropzone:focus-visible { 
    border-color: var(--pastel-wonderland--77ccf6);
    box-shadow: 0 0 0 4px rgba(138,180,255,.15);
}
.dropzone.active {
    background: rgba(255,255,255,0.05);
    border-color: var(--wonderland--1fb4ff);
    transform: translateY(-1px);
}

.dz-icon { 
    font-size: 44px; 
    display: block; 
    margin: 0 auto 6px; 
    opacity: 0.9; 
}
.dz-title { 
    margin: 6px 0 2px; 
}
.dz-sub {  
    margin: 0 0 6px; 
    opacity: .85; 
}
.dz-accept { 
    margin: 0; 
    font-size: .9rem; 
    opacity: .65; 
}

.dz-picked-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 4px;
}
.dz-picked-left {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    min-width: 0; 
}
.dz-picked-icon {
    font-size: 36px;
    flex: 0 0 auto;
    opacity: 0.95;
}
.dz-picked-meta {
    display: flex;
    align-items: baseline;
    gap: 0.5rem; 
    min-width: 0;
}
.dz-picked-name {
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 380px;
}
.dz-picked-size {
    opacity: 0.75;
    font-size: 0.9rem;
}
.dz-clear {
    all: unset;
    cursor: pointer;
    padding: 6px 8px;
    border-radius: 8px;
}
.dz-clear:hover { 
    background: var(--background-tertiary); 
}
.dz-picked-size { 
    opacity: .75; 
}
.dz-title { 
    margin: 6px 0 2px; 
}
.dz-sub { 
    margin: 0 0 6px; 
    opacity: .85; 
}
.dz-accept { 
    margin: 0; 
    font-size: .9rem; 
    opacity: .65; 
}

.actions { 
    display: flex; 
    gap: 10px; 
    margin-top: 8px; 
}
.hidden-input { 
    display: none; 
}

.primary, .ghost {
    display: inline-flex; 
    align-items: center; 
    gap: 8px;
    padding: 8px 12px; 
    border-radius: 10px; 
    cursor: pointer;
}
.primary { 
    background: var(--fill-01); 
    color: var(--background-primary); 
}
.primary:hover { 
    background: var(--fill-02); 
}
.ghost:hover { 
    background: var(--background-tertiary); 
}
.btn-ico { 
    font-size: 18px; 
}
.chip {
    display: inline-flex; 
    align-items: center; 
    gap: 8px;
    margin-top: 12px; 
    padding: 6px 10px;
    background: var(--background-tertiary); 
    border: 1px solid var(--fill-03); 
    border-radius: 999px;
}
.chip-ico { font-size: 16px; }
.chip-name { 
    max-width: 360px; 
    overflow: hidden; 
    text-overflow: ellipsis; 
    white-space: nowrap; 
}
.chip-size { opacity: .7; }
.chip-x { all: unset; cursor: pointer; padding: 4px 6px; border-radius: 6px; }
.chip-x:hover { background: var(--background-secondary); }

.error {
    margin-top: 10px; color: #ff6b6b; display: inline-flex; gap: 6px; align-items: center;
    background: #2a1414; border: 1px solid #703b3b; border-radius: 10px; padding: 6px 10px;
}
.err-ico { font-size: 18px; }
</style>
<script lang="ts">
    import Modal from "$lib/components/overview-page/Modal.svelte";
    import Icon from "@iconify/svelte";
    import ButtonPrimaryMedium from "$lib/components/global/ButtonPrimaryMedium.svelte";
    import ButtonTintedMedium from "$lib/components/global/ButtonTintedMedium.svelte";

    // Props:
    // - showModal: controlled by parent (bind)
    // - current: { name: string; size: number } | null (info about the committed file, if any)
    // - oncommit: (file: File | null) => Promise<void> | void
    let {
        showModal = $bindable(false),
        current = undefined,
        oncommit = undefined
    } = $props();

    // ------- UI helpers -------
    const exts = [".csv", ".tsv"];
    const isAllowed = (name: string) => exts.some((e) => name.toLowerCase().endsWith(e));
    const fmtBytes = (b: number) =>
        b < 1024
        ? `${b} B`
        : b < 1024 ** 2
        ? `${(b / 1024).toFixed(1)} KB`
        : `${(b / 1024 ** 2).toFixed(1)} MB`;

    function iconFor(name: string) {
        const lower = name.toLowerCase();
        if (lower.endsWith(".csv")) return "tabler:file-type-csv";
        if (lower.endsWith(".tsv") || lower.endsWith(".tab")) return "tabler:file-type-txt";
        return "tabler:file";
    }

    // ------- Local state -------
    let errorMsg = $state<string | null>(null);

    let fileInput: HTMLInputElement | null = null;

    // Drag state
    let dragDepth = $state(0);
    let dragActive = $state(false);

    // Baseline = committed state when the modal opens
    let baselineName = $state<string | null>(null);
    let baselineSize = $state<number | null>(null);

    // Staged file (pending save), or null if user cleared selection
    let stagedFile = $state<File | null>(null);
    let stagedClear = $state(false);

    // When the modal opens, capture the current baseline and reset staging
    $effect(() => {
        if (showModal) {
        errorMsg = null;
        stagedFile = null;
        stagedClear = false;  

        baselineName = current?.name ?? null;
        baselineSize = current?.size ?? null;

        // reset drag + input
        if (fileInput) fileInput.value = "";
        dragDepth = 0;
        dragActive = false;
        }
    });

    // “View” fields for the pill: either staged or baseline
    const viewName = $derived(stagedClear ? null : (stagedFile ? stagedFile.name : baselineName));
    const viewSize = $derived(stagedClear ? null : (stagedFile ? (stagedFile.size ?? null) : baselineSize));
    const viewIcon = $derived(viewName ? iconFor(viewName) : null);
    const hasSelection = $derived(!!viewName);
    const canSave = $derived(stagedFile !== null || (stagedClear && baselineName !== null));

    // ------- Actions -------
    function pickFile() {
        errorMsg = null;
        fileInput?.click();
    }

    function stagePicked(file: File) {
        stagedClear = false;
        stagedFile = file;
        errorMsg = null;
    }

    function onClearClick() {
        // Stage a “removal” (no file)
        stagedFile = null;
        stagedClear = true; 
        if (fileInput) fileInput.value = "";
    }

    async function onSave() {
        // oncommit gets: File (new) OR null (clear)
        await oncommit?.(stagedClear ? null : stagedFile);
        showModal = false;
    }

    function onCancel() {
        // Revert to baseline state, keep modal open/then you close by clicking Cancel button
        errorMsg = null;
        stagedFile = null;
        stagedClear = false;
        if (fileInput) fileInput.value = "";
    }

    // ------- Drag & Drop -------
    function onDragEnter(e: DragEvent) {
        e.preventDefault();
        dragDepth += 1;
        dragActive = true;
    }
    function onDragOver(e: DragEvent) {
        e.preventDefault(); // keeps drop enabled
    }
    function onDragLeave(e: DragEvent) {
        e.preventDefault();
        dragDepth = Math.max(0, dragDepth - 1);
        if (dragDepth === 0) dragActive = false;
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
            stagePicked(file);
    }

    // ------- Input change -------
    function handlePicked(files: FileList | null) {
        errorMsg = null;
        const file = files?.[0];
        if (!file) return;

        if (!isAllowed(file.name)) {
            errorMsg = `Unsupported file type. Allowed: ${exts.join(", ")}`;
            return;
        }
        stagePicked(file);
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
                e.preventDefault();
                pickFile();
                }
            }}
        >
            {#if hasSelection}
                <div class="dz-picked-row">
                    <div class="dz-picked-left">
                        {#if viewIcon}
                            <Icon icon={viewIcon} class="dz-picked-icon" />
                        {:else}
                        <Icon icon="tabler:file" class="dz-picked-icon" />
                        {/if}

                        <div class="dz-picked-meta">
                            <div class="dz-picked-name body-accent">{viewName}</div>

                            {#if viewSize !== null}
                                <div class="dz-picked-size caption">{fmtBytes(viewSize)}</div>
                            {/if}
                        
                        </div>
                    </div>
                    <button class="dz-clear" onclick={onClearClick} aria-label="Clear file">✕</button>
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
                accept=".csv,.tsv"
                class="hidden-input"
                onchange={(e) => handlePicked((e.currentTarget as HTMLInputElement).files)}
            />

            <ButtonTintedMedium
                label="Cancel"
                onclick={() => {
                onCancel();
                showModal = false; // close and revert to baseline
                }}
                width="8%"
            />

            <ButtonPrimaryMedium
                icon="device-floppy"
                label="Save"
                onclick={onSave}
                disabled={!canSave}
            />
        </div>

        {#if hasSelection}
            <div class="chip">
                <Icon icon="tabler:file" class="chip-ico" />
                <span class="chip-name body-accent">{viewName}</span>
                {#if viewSize !== null}
                    <span class="chip-size caption">({fmtBytes(viewSize)})</span>
                {/if}
                <button class="chip-x body-accent" aria-label="Clear file" onclick={onClearClick}>✕</button>
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
  .title {
    margin: 0;
  }

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
    pointer-events: auto;
    min-height: 140px;
    gap: 0.5rem;
    text-align: center;
  }
  .dropzone:hover {
    border-color: var(--pastel-wonderland--77ccf6);
    background: var(--background-tertiary);
  }
  .dropzone:focus-visible {
    border-color: var(--pastel-wonderland--77ccf6);
    box-shadow: 0 0 0 4px rgba(138, 180, 255, 0.15);
  }
  .dropzone.active {
    background: rgba(255, 255, 255, 0.05);
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
  .dz-accept {
    margin: 0;
    font-size: 0.9rem;
    opacity: 0.65;
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

  .actions {
    display: flex;
    gap: 10px;
    margin-top: 8px;
  }
  .hidden-input {
    display: none;
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
  .chip-ico {
    font-size: 16px;
  }
  .chip-name {
    max-width: 360px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .chip-size {
    opacity: 0.7;
  }
  .chip-x {
    all: unset;
    cursor: pointer;
    padding: 4px 6px;
    border-radius: 6px;
  }
  .chip-x:hover {
    background: var(--background-secondary);
  }

  .error {
    margin-top: 10px;
    color: #ff6b6b;
    display: inline-flex;
    gap: 6px;
    align-items: center;
    background: #2a1414;
    border: 1px solid #703b3b;
    border-radius: 10px;
    padding: 6px 10px;
  }
  .err-ico {
    font-size: 18px;
  }
</style>
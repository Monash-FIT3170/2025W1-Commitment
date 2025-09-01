<script lang="ts">
    import Icon from "@iconify/svelte";
    import ButtonPrimaryMedium from "$lib/components/global/ButtonPrimaryMedium.svelte";
    import ButtonTintedMedium from "$lib/components/global/ButtonTintedMedium.svelte";
    import Modal from "$lib/components/overview-page/Modal.svelte";
    import type { Contributor } from "$lib/metrics";
    import { count_matches } from "$lib/utils/grading";

    // Props:
    // - show_modal: controlled by parent (bind)
    // - current: { name: string; size: number; bytes?: Uint8Array } | null
    // - on_commit: (file: File | null) => Promise<void> | void
    // - contributors: Contributor[] (for previewing matched rows)
    let {
        show_modal = $bindable(false),
        current = undefined,
        on_commit = undefined,
        contributors = [] as Contributor[],
    } = $props();

    // ------- UI helpers -------
    const exts = [".csv", ".tsv"];
    const is_allowed = (name: string) =>
        exts.some((e) => name.toLowerCase().endsWith(e));
    const fmt_bytes = (b: number) =>
        b < 1024
            ? `${b} B`
            : b < 1024 ** 2
              ? `${(b / 1024).toFixed(1)} KB`
              : `${(b / 1024 ** 2).toFixed(1)} MB`;

    function icon_for(name: string) {
        const lower = name.toLowerCase();
        if (lower.endsWith(".csv")) return "tabler:file-type-csv";
        if (lower.endsWith(".tsv") || lower.endsWith(".tab"))
            return "tabler:file-type-txt";
        return "tabler:file";
    }

    // ------- Local state -------
    let error_msg = $state<string | null>(null);

    let file_input: HTMLInputElement | null = null;

    // Drag state
    let drag_depth = $state(0);
    let drag_active = $state(false);

    // Baseline = committed state when the modal opens
    let baseline_name = $state<string | null>(null);
    let baseline_size = $state<number | null>(null);

    // Staged file (pending save), or null if user cleared selection
    let staged_file = $state<File | null>(null);
    let staged_clear = $state(false);

    // Match preview state
    let match_total = $state(0);
    let match_matched = $state(0);
    let match_loading = $state(false);

    async function compute_preview_from_bytes(bytes: Uint8Array) {
        match_loading = true;
        try {
            const { matched, total } = count_matches(contributors, bytes);
            match_matched = matched;
            match_total = total;
        } finally {
            match_loading = false;
        }
    }

    // When the modal opens, capture the baseline and reset staging + preview
    $effect(() => {
        if (show_modal) {
            error_msg = null;
            staged_file = null;
            staged_clear = false;

            baseline_name = current?.name ?? null;
            baseline_size = current?.size ?? null;

            if (file_input) file_input.value = "";
            drag_depth = 0;
            drag_active = false;

            // preview for existing committed file (if we have bytes)
            match_total = 0;
            match_matched = 0;
            match_loading = false;
            const bytes = (current as any)?.bytes as Uint8Array | undefined;
            if (bytes && bytes.length) {
                void compute_preview_from_bytes(bytes);
            }
        }
    });

    // “View” fields for the pill: either staged or baseline
    const view_name = $derived(
        staged_clear ? null : staged_file ? staged_file.name : baseline_name
    );
    const view_size = $derived(
        staged_clear
            ? null
            : staged_file
              ? (staged_file.size ?? null)
              : baseline_size
    );
    const view_icon = $derived(view_name ? icon_for(view_name) : null);
    const has_selection = $derived(!!view_name);
    const can_save = $derived(
        staged_file !== null || (staged_clear && baseline_name !== null)
    );

    // ------- Actions -------
    function pick_file() {
        error_msg = null;
        file_input?.click();
    }

    async function stage_picked(file: File) {
        staged_clear = false;
        staged_file = file;
        error_msg = null;

        // compute preview for newly staged file
        const bytes = new Uint8Array(await file.arrayBuffer());
        void compute_preview_from_bytes(bytes);
    }

    function on_clear_click() {
        // Stage a “removal” (no file)
        staged_file = null;
        staged_clear = true;
        if (file_input) file_input.value = "";

        // clear preview numbers
        match_total = 0;
        match_matched = 0;
        match_loading = false;
    }

    async function on_save() {
        await on_commit?.(staged_clear ? null : staged_file);
        show_modal = false;
    }

    function on_cancel() {
        // Revert to baseline state
        error_msg = null;
        staged_file = null;
        staged_clear = false;
        if (file_input) file_input.value = "";

        // restore preview to baseline file (if any)
        match_total = 0;
        match_matched = 0;
        match_loading = false;
        const bytes = (current as any)?.bytes as Uint8Array | undefined;
        if (bytes && bytes.length) {
            void compute_preview_from_bytes(bytes);
        }
    }

    // ------- Drag & Drop -------
    function on_drag_enter(e: DragEvent) {
        e.preventDefault();
        drag_depth += 1;
        drag_active = true;
    }
    function on_drag_over(e: DragEvent) {
        e.preventDefault();
    }
    function on_drag_leave(e: DragEvent) {
        e.preventDefault();
        drag_depth = Math.max(0, drag_depth - 1);
        if (drag_depth === 0) drag_active = false;
    }
    function on_drop(e: DragEvent) {
        e.preventDefault();
        drag_active = false;
        drag_depth = 0;
        const file = e.dataTransfer?.files?.[0];
        if (!file) return;

        if (!is_allowed(file.name)) {
            error_msg = `Unsupported file type. Allowed: ${exts.join(", ")}`;
            return;
        }
        void stage_picked(file);
    }

    // ------- Input change -------
    function handle_picked(files: FileList | null) {
        error_msg = null;
        const file = files?.[0];
        if (!file) return;

        if (!is_allowed(file.name)) {
            error_msg = `Unsupported file type. Allowed: ${exts.join(", ")}`;
            return;
        }
        void stage_picked(file);
    }
</script>

<Modal bind:show_modal>
    {#snippet header()}
        <h2 class="title label-primary">Upload grading sheet</h2>
    {/snippet}

    {#snippet body()}
        <div
            class={`dropzone ${drag_active ? "active" : ""}`}
            ondragenter={on_drag_enter}
            ondragover={on_drag_over}
            ondragleave={on_drag_leave}
            ondrop={on_drop}
            onclick={pick_file}
            tabindex="0"
            role="button"
            aria-label="Upload grading sheet"
            onkeydown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    pick_file();
                }
            }}
        >
            {#if has_selection}
                <div class="dz-picked-row">
                    <div class="dz-picked-left">
                        {#if view_icon}
                            <Icon icon={view_icon} class="dz-picked-icon" />
                        {:else}
                            <Icon icon="tabler:file" class="dz-picked-icon" />
                        {/if}

                        <div class="dz-picked-meta">
                            <div class="dz-picked-name body-accent">
                                {view_name}
                            </div>

                            {#if view_size !== null}
                                <div class="dz-picked-size caption">
                                    {fmt_bytes(view_size)}
                                </div>
                            {/if}
                        </div>
                    </div>
                    <button
                        class="dz-clear"
                        onclick={on_clear_click}
                        aria-label="Clear file">✕</button
                    >
                </div>
            {:else}
                <Icon icon="tabler:upload" class="dz-icon" />
                <p class="body-accent dz-title">
                    <strong>Click To Select Your File</strong>
                </p>
                <p class="caption dz-accept">Accepted: {exts.join(", ")}</p>
            {/if}
        </div>

        <div class="actions">
            <input
                bind:this={file_input}
                type="file"
                accept=".csv,.tsv"
                class="hidden-input"
                onchange={(e) =>
                    handle_picked((e.currentTarget as HTMLInputElement).files)}
            />

            <ButtonTintedMedium
                label="Cancel"
                onclick={() => {
                    on_cancel();
                    show_modal = false; /* close and revert to baseline */
                }}
                width="8%"
            />

            <ButtonPrimaryMedium
                icon="device-floppy"
                label="Save"
                onclick={on_save}
                disabled={!can_save}
            />
        </div>

        {#if has_selection}
            <div class="chip">
                <Icon icon="tabler:file" class="chip-ico" />
                <span class="chip-name body-accent">{view_name}</span>
                {#if view_size !== null}
                    <span class="chip-size caption"
                        >({fmt_bytes(view_size)})</span
                    >
                {/if}
                <button
                    class="chip-x body-accent"
                    aria-label="Clear file"
                    onclick={on_clear_click}>✕</button
                >
            </div>
        {/if}

        {#if match_loading}
            <div class="match-preview caption">Checking contributors…</div>
        {:else if match_total > 0}
            <div class="match-preview caption">
                {match_matched} / {match_total} contributors found in the repository
            </div>
        {/if}

        {#if error_msg}
            <div class="error err-banner caption">
                <Icon icon="tabler:alert-circle" class="err-ico" />
                {error_msg}
            </div>
        {/if}
    {/snippet}
</Modal>

<style>
    .title {
        margin-top: 0.2rem;
        margin-bottom: 0.9rem;
        margin-left: 0.5rem;
    }

    .dropzone {
        user-select: none;
        border: 0.125rem dashed var(--fill-03);
        border-radius: 0.875rem;
        padding: 1.75rem 1.25rem;
        text-align: center;
        color: #eaeaea;
        background: linear-gradient(
            180deg,
            var(--background-secondary) 0%,
            var(--background-primary) 100%
        );
        transition:
            border-color 120ms ease,
            background 120ms ease,
            transform 80ms ease;
        outline: none;
        margin-bottom: 0.75rem;
        pointer-events: auto;
        min-height: 8.75rem;
        gap: 0.5rem;
        text-align: center;
    }
    .dropzone:hover {
        border-color: var(--pastel-wonderland--77ccf6);
        background: var(--background-tertiary);
    }
    .dropzone:focus-visible {
        border-color: var(--pastel-wonderland--77ccf6);
        box-shadow: 0 0 0 0.25rem rgba(138, 180, 255, 0.15);
    }
    .dropzone.active {
        background: rgba(255, 255, 255, 0.05);
        border-color: var(--wonderland--1fb4ff);
        transform: translateY(-0.0625rem);
    }

    .dz-icon {
        font-size: 2.75rem;
        display: block;
        margin: 0 auto 0.375rem;
        opacity: 0.9;
    }
    .dz-title {
        margin: 0.375rem 0 0.125rem;
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
        gap: 0.75rem;
        margin-bottom: 0.25rem;
    }
    .dz-picked-left {
        display: inline-flex;
        align-items: center;
        gap: 0.75rem;
        min-width: 0;
    }
    .dz-picked-icon {
        font-size: 2.25rem;
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
        max-width: 23.75rem;
    }
    .dz-picked-size {
        opacity: 0.75;
        font-size: 0.9rem;
    }
    .dz-clear {
        all: unset;
        cursor: pointer;
        padding: 0.375rem 0.5rem;
        border-radius: 0.5rem;
    }
    .dz-clear:hover {
        background: var(--background-tertiary);
    }

    .actions {
        display: flex;
        gap: 0.625rem;
        margin-top: 0.5rem;
    }
    .hidden-input {
        display: none;
    }

    .match-preview {
        margin-top: 0.5rem;
        opacity: 0.85;
    }

    .chip {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        margin-top: 0.75rem;
        padding: 0.375rem 0.625rem;
        background: var(--background-tertiary);
        border: 0.0625rem solid var(--fill-03);
        border-radius: 999px;
    }
    .chip-ico {
        font-size: 1rem;
    }
    .chip-name {
        max-width: 22.5rem;
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
        padding: 0.25rem 0.375rem;
        border-radius: 0.375rem;
    }
    .chip-x:hover {
        background: var(--background-secondary);
    }

    .error {
        margin-top: 0.625rem;
        color: #ff6b6b;
        display: inline-flex;
        gap: 0.375rem;
        align-items: center;
        background: #2a1414;
        border: 0.0625rem solid #703b3b;
        border-radius: 0.625rem;
        padding: 0.375rem 0.625rem;
    }
    .err-ico {
        font-size: 1.125rem;
    }

    .match-preview {
        margin-top: 1rem;
        margin-left: 0.6rem;
        opacity: 0.65;
    }
</style>

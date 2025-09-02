<script lang="ts">
    import { info, warn } from "@tauri-apps/plugin-log";
    import { page } from "$app/state";
    import ButtonPrimaryMedium from "$lib/components/global/ButtonPrimaryMedium.svelte";
    import CommitGraph from "$lib/components/overview-page/CommitGraph.svelte";
    import Heading from "$lib/components/overview-page/Heading.svelte";
    import UploadFileModal from "$lib/components/overview-page/UploadFileModal.svelte";
    import type { UploadedGradingFile } from "$lib/stores/gradingFile";
    import { read_headers, validate_headers } from "$lib/utils/csv";
    import { download_populated_file } from "$lib/utils/grading";
    import { load_branches, load_commit_data } from "$lib/metrics";

    let repo_path = $state(page.state.repo_path || "");
    let repo_type = $state(page.state.repo_type || "");
    let branches = $state(page.state.branches || []);
    let contributors = $state(page.state.contributors || []);
    let source_type = $state(page.state.source_type);

    let show_modal = $state(false);
    const open_modal = () => (show_modal = true);

    let current_upload = $state<UploadedGradingFile | null>(null);

    async function commit_upload(file: File | null) {
        if (!file) {
            current_upload = null; // disables download button
            void info("[upload] cleared");
            return;
        }
        const bytes = new Uint8Array(await file.arrayBuffer());
        const { headers, delimiter } = read_headers(bytes);
        const { ok, missing } = validate_headers(headers);

        current_upload = {
            name: file.name,
            size: file.size,
            mime: file.type || "text/plain",
            bytes,
            headers,
            delimiter,
            valid: ok,
            missing,
        };
        void info(`[upload] staged: ${file.name} (${file.size} bytes)`);
    }

    async function handle_download() {
        if (!contributors || !contributors.length) {
            void warn("[download] no contributors on page");
            return;
        }
        if (!current_upload) {
            void warn("[download] no uploaded file in memory");
            return;
        }
        await download_populated_file(contributors, current_upload);
        void info("[download] populated file saved");
    }
  
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
        <ButtonPrimaryMedium
            icon="table-import"
            label="Upload Marking Sheet"
            onclick={open_modal}
        />
        <ButtonPrimaryMedium
            icon="file-download"
            label="Download Marking Sheet"
            onclick={handle_download}
            disabled={!current_upload || !current_upload.valid}
        />
    </div>
    <UploadFileModal
        bind:show_modal
        current={current_upload}
        on_commit={commit_upload}
        {contributors}
    />
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

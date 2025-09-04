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
    import { invoke } from "@tauri-apps/api/core";
    import { manifest } from "$lib/stores/manifest";
    import type { Contributor } from "$lib/metrics";
    import { onMount } from "svelte";

    let owner = $state(page.state.owner || "");
    let repo = $state(page.state.repo || "");
    let repo_type = $state(page.state.repo_type);
    let branches = $state(page.state.branches || []);
    let contributors = $state(page.state.contributors || []);

    let branch_selection = $state("");
    let start_date = $state("");
    let end_date = $state("");

    let source_type = $state(page.state.source_type);
    let repo_url = $state(page.state.repo_url || "");
    let email_mapping = $manifest.repository.filter(
        (r) => r.url === repo_url
    )[0].email_mapping;

    onMount(async () => {
        if (email_mapping) {
            try {
                contributors = await invoke<Contributor[]>(
                    "group_contributors_by_config",
                    {
                        config_json: email_mapping,
                        contributors: contributors,
                    }
                );
            } catch (error) {
                console.error("Error applying config:", error);
            }
        }
    });

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

    $effect(() => {
        if (
            (branch_selection && branch_selection !== "") ||
            (start_date && end_date)
        ) {
            // Fetch new contributors for the selected branch
            (async () => {
                const source =
                    source_type === 0
                        ? "https://github.com"
                        : source_type === 1
                          ? "https://gitlab.com"
                          : "";
                const branch_arg =
                    branch_selection === "" ? undefined : branch_selection;
                const new_contributors = await load_commit_data(
                    source,
                    owner,
                    repo,
                    repo_type,
                    branch_arg,
                    start_date,
                    end_date
                );

                contributors = [...new_contributors];
            })();
        }
    });

    $effect(() => {
        if ((!branches || branches.length === 0) && repo) {
            // Fetch branches for the repository
            (async () => {
                branches = await load_branches(repo);
            })();
        }
    });
</script>

<div class="page">
    <Heading
        {repo}
        {repo_type}
        {repo_url}
        {branches}
        bind:branch_selection
        bind:start_date
        bind:end_date
    />

    {#key contributors}
        <CommitGraph
            {contributors}
            {branches}
            selected_branch={branch_selection}
            {start_date}
            {end_date}
        />
    {/key}

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

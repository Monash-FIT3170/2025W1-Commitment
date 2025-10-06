<script lang="ts">
    import { info, warn, error } from "@tauri-apps/plugin-log";
    import ContributorAnalysis from "$lib/components/overview-page/ContributorAnalysis.svelte";
    import { page } from "$app/state";
    import ButtonPrimaryMedium from "$lib/components/global/ButtonPrimaryMedium.svelte";
    import CommitGraph from "$lib/components/overview-page/CommitGraph.svelte";
    import Heading from "$lib/components/overview-page/Heading.svelte";
    import Tab from "$lib/components/global/Tab.svelte";
    import UploadFileModal from "$lib/components/overview-page/UploadFileModal.svelte";
    import type { UploadedGradingFile } from "$lib/stores/gradingFile";
    import { read_headers, validate_headers } from "$lib/utils/csv";
    import { download_populated_file } from "$lib/utils/grading";
    import { load_branches, load_commit_data } from "$lib/metrics";
    import { invoke } from "@tauri-apps/api/core";
    import {
        manifest,
        type Config,
        type ManifestSchema,
    } from "$lib/stores/manifest";
    import type { Contributor } from "$lib/metrics";
    import { onMount } from "svelte";
    import { load_state } from "$lib/utils/localstorage";

    const s = page.state as any;
    load_state(s);
    let repo = $state(s.repo || "");
    let repo_path = $state(s.repo_path || "");
    let source_type: 0 | 1 | 2 = $state(s.source_type || 0); // 0 = GitHub, 1 = GitLab, 2 = Local
    let repo_url = $state(s.repo_url || "");

    let branches = $state(s.branches || []);
    let contributors = $state(s.contributors || []);
    let branch_selection = $state(s.branch_selection || "");
    let start_date = $state(s.start_date || "");
    let end_date = $state(s.end_date || "");
    let email_mapping: Config | null = $derived(
        $manifest.repository.filter((r) => r.url === repo_url)[0]
            ?.email_mapping || null
    );

    //let criteria = ["total commits", "lines of code", "lines/commit"];
    let criteria: string[] = ["commits", "commit_size", "absolute_diff"];
    let selected_criteria = $state(criteria[0]);
    let aggregation_options = ["mean", "median"];
    let selected_aggregation = $state("mean");

    let selected_view: string = $state("overview");

    const tabs = [
        { id: "overview", label: "Overview", icon: "chart-line" },
        { id: "analysis", label: "Contribution Analysis", icon: "id" },
    ];

    function select_view(id: string) {
        selected_view = id;
        info(selected_view);
    }

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

        await download_populated_file(
            contributors,
            current_upload,
            selected_aggregation
        );
        void info("[download] populated file saved");
    }

    async function load_graph() {
        const branch_arg =
            branch_selection === "" ? undefined : branch_selection;
        info(
            "Loading graph with: " +
                JSON.stringify({
                    repo_path,
                    branch_arg,
                    start_date,
                    end_date,
                })
        );
        let new_contributors = await load_commit_data(
            repo_path,
            branch_arg,
            start_date,
            end_date
        );

        // Apply config grouping if email_mapping is present
        if (email_mapping) {
            try {
                new_contributors = await invoke<Contributor[]>(
                    "group_contributors_by_config",
                    {
                        config_json: email_mapping,
                        contributors: new_contributors,
                    }
                );
            } catch (e) {
                error("Error applying config after branch change: " + e);
            }
        }
        contributors = [...new_contributors];
    }

    $effect(() => {
        if (
            (branch_selection && branch_selection !== "") ||
            (start_date && end_date) ||
            (start_date === "" && end_date === "")
        ) {
            (async () => {
                // Fetch new contributors for the selected branch
                await load_graph();
            })();
        }
    });

    $effect(() => {
        if ((!branches || branches.length === 0) && repo) {
            // Fetch branches for the repository
            (async () => {
                branches = await load_branches(repo_path);
            })();
        }
    });

    onMount(async () => {
        try {
            let data = await invoke<ManifestSchema>("read_manifest");
            manifest.set(data);
            info("page " + data);
        } catch (e: any) {
            let err = typeof e === "string" ? e : (e?.message ?? String(e));
            error("read_manifest failed: " + err);
        }
        if (email_mapping) {
            try {
                contributors = await invoke<Contributor[]>(
                    "group_contributors_by_config",
                    {
                        config_json: email_mapping,
                        contributors: contributors,
                    }
                );
            } catch (e) {
                error("Error applying config: " + e);
            }
        }
        if (branches.length === 0 || contributors.length === 0) {
            await load_graph();
        }
    });
</script>

<div class="page">
    <Heading
        {repo}
        {source_type}
        {repo_url}
        {repo_path}
        {branches}
        bind:branch_selection
        bind:start_date
        bind:end_date
        bind:contributors
    />

    <div class="page-select-btns">
        <!-- for each tab -->
        {#each tabs as tab}
            <Tab
                label={tab.label}
                icon={tab.icon}
                selected={selected_view === tab.id}
                width="100%"
                onclick={() => select_view(tab.id)}
            />
        {/each}
    </div>

    <!-- commit graph -->
    {#if selected_view === "overview"}
        {#key contributors}
            <CommitGraph
                {contributors}
                {branches}
                selected_branch={branch_selection}
                {start_date}
                {end_date}
                {criteria}
                bind:selected_criteria
                {aggregation_options}
                bind:selected_aggregation
            />
        {/key}
    {:else if selected_view === "analysis"}
        <ContributorAnalysis
            {contributors}
            {repo_path}
            {email_mapping}
            {source_type}
            {selected_criteria}
            aggregation={selected_aggregation}
        />
    {/if}

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
        padding-bottom: 2rem;
        gap: 1rem;
    }

    .page-select-btns {
        display: grid;
        grid-template-columns: 20rem 20rem;
        column-gap: 1rem;
        padding-top: 2rem;
        z-index: 1;
        padding: 0rem 4rem;
    }

    @media (max-width: 75rem) {
        .page-select-btns {
            grid-template-columns: 16rem 16rem;
            padding-top: 0rem;
            padding-bottom: 1rem;
        }
    }
</style>

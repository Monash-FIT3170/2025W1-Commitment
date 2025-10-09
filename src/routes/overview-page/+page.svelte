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
    import {
        load_state,
        save_state,
        generate_state_object,
    } from "$lib/utils/localstorage";
    import { auth_error, retry_clone_with_token } from "$lib/stores/auth";
    import AccessTokenModal from "$lib/components/global/AccessTokenModal.svelte";
    import { get_repo_info } from "$lib/github_url_verifier";
    import {
        set_refresh_function,
        set_refreshing,
        set_delete_function,
    } from "$lib/stores/refresh.svelte";
    import { goto } from "$app/navigation";

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

    let manifest_state = $state<ManifestSchema>({ repository: [] });

    // Subscribe to manifest store
    $effect(() => {
        const unsubscribe = manifest.subscribe((value) => {
            manifest_state = value;
        });
        return unsubscribe;
    });

    let email_mapping: Config | null = $derived(
        manifest_state.repository.filter((r) => r.url === repo_url)[0]
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

    let auth_error_state = $state({ needs_token: false, message: "" });

    // Subscribe to auth_error store
    $effect(() => {
        const unsubscribe = auth_error.subscribe((value) => {
            auth_error_state = value;
        });
        return unsubscribe;
    });

    let show_auth_modal = $derived(auth_error_state.needs_token);

    async function reload_repository_data() {
        try {
            info("Reloading branches and contributors data...");

            const new_branches = await load_branches(repo_path);
            branches = new_branches;

            const new_contributors = await load_commit_data(repo_path);

            if (email_mapping) {
                try {
                    const grouped = await invoke<Contributor[]>(
                        "group_contributors_by_config",
                        {
                            config_json: email_mapping,
                            contributors: new_contributors,
                        }
                    );
                    contributors = grouped;
                } catch (e) {
                    error("Error applying config after refresh: " + e);
                    contributors = new_contributors;
                }
            } else {
                contributors = new_contributors;
            }

            const working_dir = await invoke<string>("get_working_directory");
            const repository_information = get_repo_info(repo_url);
            const storage_obj = await generate_state_object(
                working_dir,
                repository_information,
                repo_url,
                source_type,
                branches,
                contributors
            );
            await save_state(storage_obj);

            info("Repository data reloaded successfully");
        } catch (e) {
            error("Failed to reload repository data: " + e);
        }
    }

    async function refresh_repository() {
        set_refreshing(true);
        try {
            info(`Refreshing repository: ${repo_url} at ${repo_path}`);

            await invoke("refresh_repo", {
                url: repo_url,
                path: repo_path,
            });

            info("Repository refreshed successfully");
            await reload_repository_data();
        } catch (e: any) {
            const error_message = e.message || String(e);
            error("Failed to refresh repository: " + error_message);

            if (error_message.includes("private and requires authentication")) {
                info("Authentication required for refresh");
                auth_error.set({
                    needs_token: true,
                    message:
                        "This repository is private. Please provide a Personal Access Token to refresh.",
                    repo_url: repo_url,
                    repo_path: repo_path,
                });
            }
        } finally {
            set_refreshing(false);
        }
    }

    async function handle_token_add(token: string) {
        if (!token || token.trim().length === 0) {
            info("No token entered");
            return;
        }

        info("Authenticating with Personal Access Token for refresh...");

        const success = await retry_clone_with_token(token);

        if (success) {
            info("Authentication successful, repository refreshed");
            await reload_repository_data();
        } else {
            error("Authentication failed, please check your token");
        }
    }

    async function delete_repository() {
        try {
            info(`Deleting repository at: ${repo_path}`);
            await invoke("delete_repo", { path: repo_path });

            // Remove from manifest
            const updated_manifest = {
                ...manifest_state,
                repository: manifest_state.repository.filter(
                    (item) => item.url !== repo_url
                ),
            };
            manifest.set(updated_manifest);
            await invoke("save_manifest", { manifest: updated_manifest });

            info("Repository deleted successfully, navigating to home");
            goto("/");
        } catch (e) {
            error("Failed to delete repository: " + e);
        }
    }

    onMount(async () => {
        // Set refresh and delete functions in store so layout can access them
        set_refresh_function(refresh_repository);
        set_delete_function(delete_repository);

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

<!-- Access Token Modal for private repository refresh -->
<AccessTokenModal
    bind:show_modal={show_auth_modal}
    on_token_add={handle_token_add}
/>

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

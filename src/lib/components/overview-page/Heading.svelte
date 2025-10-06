<script lang="ts">
    import Icon from "@iconify/svelte";
    import ButtonTintedMedium from "$lib/components/global/ButtonTintedMedium.svelte";
    import DropdownTintedMedium from "$lib/components/global/DropdownTintedMedium.svelte";
    import Tab from "$lib/components/global/Tab.svelte";
    import Calendar from "$lib/components/global/Calendar.svelte";
    import Modal from "$lib/components/overview-page/Modal.svelte";
    import { validate_config_file } from "$lib/file_validation";
    import { invoke } from "@tauri-apps/api/core";
    import { manifest } from "$lib/stores/manifest";
    import type { Contributor } from "$lib/metrics";
    import { info, error } from "@tauri-apps/plugin-log";
    import AccessTokenModal from "$lib/components/global/AccessTokenModal.svelte";
    import { auth_error, retry_clone_with_token } from "$lib/stores/auth";
    import { load_branches, load_commit_data } from "$lib/metrics";
    import { save_state, generate_state_object } from "$lib/utils/localstorage";
    import { get_repo_info } from "$lib/github_url_verifier";

    let {
        repo: repo,
        source_type: source_type = 0,
        repo_url,
        repo_path,
        branches = $bindable<string[]>([]),
        branch_selection = $bindable(),
        start_date = $bindable(),
        end_date = $bindable(),
        contributors = $bindable<Contributor[]>([]),
    } = $props();

    let source_name =
        source_type === 0
            ? "github"
            : source_type === 1
              ? "gitlab"
              : "folder-code";
    let show_modal = $state(false);

    let file_input: HTMLInputElement;

    function trigger_file_input() {
        file_input.click();
    }

    let textarea_value = "";

    async function handle_file_change(event: Event) {
        const selected_files = (event.target as HTMLInputElement).files;
        if (selected_files && selected_files.length > 0) {
            // Helper to read file as text using Promise
            function read_file_async(file: File): Promise<string> {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve(e.target?.result as string);
                    reader.onerror = reject;
                    reader.readAsText(file);
                });
            }

            try {
                const text = await read_file_async(selected_files[0]);
                const json = JSON.parse(text);
                const { valid, errors } = validate_config_file(json);
                if (valid) {
                    try {
                        const result = await invoke<Contributor[]>(
                            "group_contributors_by_config",
                            {
                                config_json: json,
                                contributors: contributors,
                            }
                        );

                        info("Config applied successfully:", result);

                        contributors = result;
                        manifest.update_email_mapping(json, repo_url);
                        await invoke("save_manifest", { manifest: $manifest });
                    } catch (e) {
                        error("Error applying config: " + e);
                    }
                } else {
                    textarea_value =
                        "Invalid format:\n" + JSON.stringify(errors, null, 2);
                }
            } catch {
                textarea_value = "Not valid JSON";
            }

            show_modal = false;
        }
    }

    function handle_date_change(
        event: CustomEvent<{ start: string; end: string }>
    ) {
        start_date = event.detail.start;
        end_date = event.detail.end;
    }

    let refreshing = $state(false);
    let show_auth_modal = $derived($auth_error.needs_token);

    async function reload_repository_data() {
        try {
            info("Reloading branches and contributors data...");

            // Reload branches
            const new_branches = await load_branches(repo_path);
            branches = new_branches;

            // Reload contributors
            const new_contributors = await load_commit_data(repo_path);

            // Apply email mapping if present
            const email_mapping = $manifest.repository.find(
                (r) => r.url === repo_url
            )?.email_mapping;

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

            // Update localStorage
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
        refreshing = true;
        try {
            info(`Refreshing repository: ${repo_url} at ${repo_path}`);

            // Call refresh_repo command
            await invoke("refresh_repo", {
                url: repo_url,
                path: repo_path,
            });

            info("Repository refreshed successfully");

            // Reload branches and contributors data
            await reload_repository_data();
        } catch (e: any) {
            const error_message = e.message || String(e);
            error("Failed to refresh repository: " + error_message);

            // Check if this is an authentication error
            if (error_message.includes("private and requires authentication")) {
                info("Authentication required for refresh");
                // Set auth error to trigger modal
                auth_error.set({
                    needs_token: true,
                    message:
                        "This repository is private. Please provide a Personal Access Token to refresh.",
                    repo_url: repo_url,
                    repo_path: repo_path,
                });
            }
        } finally {
            refreshing = false;
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
            // Reload branches and contributors data
            await reload_repository_data();
        } else {
            error("Authentication failed, please check your token");
        }
    }
</script>

<div class="page-header">
    <div class="top-container">
        <div class="repo-path-container">
            <span class="repo-path display-title" title={repo}>{repo}</span>
            <div class="repo-icon">
                <Icon
                    icon={`tabler:brand-${source_name}`}
                    class="icon-xlarge"
                    style="color: white"
                />
            </div>
        </div>

        <!-- refresh btn -->
        <div class="refresh-btn heading-btn">
            <ButtonTintedMedium
                label={refreshing ? "Refreshing..." : "Refresh"}
                icon="refresh"
                label_class="body-accent"
                icon_first={true}
                width="5.5rem"
                onclick={refresh_repository}
                disabled={refreshing}
            />
        </div>

        <!-- config btn -->
        <div class="config-btn heading-btn">
            <ButtonTintedMedium
                label="Config"
                icon="settings-2"
                label_class="body-accent"
                icon_first={true}
                width="4rem"
                onclick={() => (show_modal = true)}
            />
        </div>

        <!-- Modal -->
        <Modal bind:show_modal>
            {#snippet header()}
                <h2 id="modal-title">Upload config file</h2>
            {/snippet}

            {#snippet body()}
                <p>
                    Upload a config file to group email addresses to
                    contributors
                </p>
                <input
                    type="file"
                    bind:this={file_input}
                    style="display: none;"
                    onchange={handle_file_change}
                />
                <div style="display: flex; gap: 1rem; margin-top: 1rem;">
                    <ButtonTintedMedium
                        label="Cancel"
                        label_class="body"
                        icon_first={true}
                        width="4rem"
                        onclick={() => (show_modal = false)}
                    />
                    <ButtonTintedMedium
                        label="Upload"
                        icon="upload"
                        label_class="body-accent"
                        icon_first={true}
                        width="4rem"
                        onclick={trigger_file_input}
                    />
                </div>
            {/snippet}
        </Modal>

        <!-- branch dropdown btn -->
        <div class="branch-dropdown heading-btn">
            <DropdownTintedMedium
                options={branches}
                bind:selected={branch_selection}
                disabled={false}
            />
        </div>
        <div class="calendar-btn heading-btn">
            <!-- calendar btn -->
            <Calendar
                bind:start={start_date}
                bind:end={end_date}
                date_format="d-m-Y"
                icon="calendar"
                icon_first={true}
                label_class="body-accent"
                label="Select Date Range"
                disabled={false}
                width={start_date && end_date ? "14rem" : "7rem"}
                on:change={handle_date_change}
            />
        </div>
    </div>

    <div class="heading-btn-spacer"></div>

    <span class="subtitle display-subtitle">Contribution Statistics</span>
</div>

<!-- Access Token Modal for private repository refresh -->
<AccessTokenModal
    bind:show_modal={show_auth_modal}
    on_token_add={handle_token_add}
/>

<style>
    .page-header {
        display: flex;
        flex-direction: column;
        padding: 2rem 4rem;
    }

    .top-container {
        display: grid;
        grid-template-columns: 1fr auto auto auto auto;
        grid-template-areas:
            "repo-path refresh config branch calendar"
            "subtitle subtitle subtitle subtitle heading-btn-spacer";
        align-items: center;
        column-gap: 1rem;
    }

    .repo-path-container {
        grid-area: repo-path;
        display: flex;
        align-items: center;
        gap: 1.5rem;
        min-width: 0;
    }

    .repo-path {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        min-width: 0;
    }

    .repo-icon {
        flex-shrink: 0;
        padding-right: 4rem;
    }

    .display-subtitle {
        color: var(--label-secondary);
        padding: 0.6rem 0;
    }

    .refresh-btn {
        grid-area: refresh;
    }

    .config-btn {
        grid-area: config;
    }

    .branch-dropdown {
        grid-area: branch;
    }

    .calendar-btn {
        grid-area: calendar;
    }

    .subtitle {
        grid-area: subtitle;
    }

    .heading-btn-spacer {
        grid-area: heading-btn-spacer;
        display: flex;
    }

    @media (max-width: 85rem) {
        .top-container {
            grid-template-columns: auto auto auto auto 1fr;
            grid-template-areas:
                "repo-path repo-path repo-path repo-path repo-path"
                "subtitle subtitle subtitle subtitle subtitle"
                "refresh config branch calendar heading-btn-spacer";
        }

        .heading-btn {
            padding-top: 1rem;
        }
    }
</style>

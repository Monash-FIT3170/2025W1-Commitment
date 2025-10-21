<script lang="ts">
    import Icon from "@iconify/svelte";
    import ButtonTintedMedium from "$lib/components/global/ButtonTintedMedium.svelte";
    import DropdownTintedMedium from "$lib/components/global/DropdownTintedMedium.svelte";
    import ErrorMessage from "../global/ErrorMessage.svelte";
    import Tab from "$lib/components/global/Tab.svelte";
    import Calendar from "$lib/components/global/Calendar.svelte";
    import Modal from "$lib/components/overview-page/Modal.svelte";
    import { validate_config_file } from "$lib/file_validation";
    import { invoke } from "@tauri-apps/api/core";
    import { manifest } from "$lib/stores/manifest";
    import { load_commit_data } from "$lib/metrics";
    import type { Contributor } from "$lib/metrics";
    import { info, error } from "@tauri-apps/plugin-log";
    import ButtonPrimaryMedium from "../global/ButtonPrimaryMedium.svelte";
    import MappingDisplay from "./MappingDisplay.svelte";
    import { page } from "$app/state";
    import { get } from "svelte/store";

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
        regex_is_active = $bindable<Boolean>(),
        config_is_active = $bindable<Boolean>(),
    } = $props();

    let source_name =
        source_type === 0
            ? "github"
            : source_type === 1
              ? "gitlab"
              : "folder-code";

    let show_config_modal = $state(false);
    let config_error = $state(false);
    let config_error_msg = $state("");

    let show_regex_modal = $state(false);
    let regex_input = $state("");
    let saved_regex = $state("");

    function save_regex() {
        saved_regex = regex_input.trim();
        show_regex_modal = false;
        if (saved_regex.length > 0) {
            regex_is_active = true;
        } else {
            regex_is_active = false;
        }
    }

    // Add effect to manage body class when modal state changes
    $effect(() => {
        const repo_entry = $manifest.repository.find((r) => r.url === repo_url);
        config_is_active = !!repo_entry?.email_mapping;

        if (show_config_modal || show_regex_modal) {
            document.body.classList.add("modal-open");
        } else {
            document.body.classList.remove("modal-open");
        }

        // Cleanup function to remove class when component unmounts
        return () => {
            document.body.classList.remove("modal-open");
        };
    });

    let file_input: HTMLInputElement;

    function trigger_file_input() {
        file_input.click();
        config_is_active = true;
    }

    async function handle_file_change(event: Event) {
        const selected_files = (event.target as HTMLInputElement).files;
        if (selected_files && selected_files.length > 0) {
            if (!selected_files[0].name.toLowerCase().endsWith(".json")) {
                config_error_msg = "Please upload a .json file";
                config_error = true;
                return;
            }
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

                        info("Config applied successfully:" + result);

                        contributors = result;
                        manifest.update_email_mapping(json, repo_url);
                        await invoke("save_manifest", { manifest: $manifest });
                        show_config_modal = false;
                    } catch (e) {
                        error("Error applying config: " + e);
                        config_error_msg =
                            "Error applying config. Please try again.";
                        config_error = true;
                    }
                } else {
                    config_error_msg = "Invalid format";
                    config_error = true;
                }
            } catch {
                config_error_msg = "Not valid JSON";
                config_error = true;
            }
        }
    }

    function handle_date_change(
        event: CustomEvent<{ start: string; end: string }>
    ) {
        start_date = event.detail.start;
        end_date = event.detail.end;
    }

    async function handle_remove_mapping() {
        try {
            manifest.remove_email_mapping(repo_url);

            // Get the current state of the manifest after the update
            const currentManifest = get(manifest);

            // Save the updated manifest to file
            await invoke("save_manifest", { manifest: currentManifest });
            info("Email mapping removed successfully");

            // Refresh contributors to show ungrouped data
            const branch_arg =
                branch_selection === "" ? undefined : branch_selection;
            const repo_path = page.state.repo_path;
            const new_contributors = await load_commit_data(
                repo_path,
                branch_arg,
                start_date,
                end_date
            );

            // Update contributors without email mapping
            contributors = [...new_contributors];

            config_is_active = false;
            show_config_modal = false;
        } catch (e) {
            error("Error removing email mapping: " + e);
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

        <!-- regex btn -->
        <div class="regex-btn heading-btn">
            {#if regex_is_active}
                <ButtonPrimaryMedium
                    label="Regex"
                    icon="regex"
                    variant="primary"
                    onclick={() => {
                        show_regex_modal = true;
                    }}
                />
            {:else}
                <ButtonTintedMedium
                    label="Regex"
                    icon="regex"
                    label_class="body-accent"
                    icon_first={true}
                    width="4rem"
                    onclick={() => {
                        show_regex_modal = true;
                    }}
                />
            {/if}
        </div>

        <!-- Regex Modal -->
        <Modal bind:show_modal={show_regex_modal}>
            {#snippet icon()}
                <Icon
                    icon="tabler:regex"
                    class="icon-medium"
                    style="color: currentColor"
                />
            {/snippet}

            {#snippet header()}Exclude Commits Using Regex{/snippet}

            {#snippet body()}
                <div class="regex-modal-content">
                    <p class="label-primary body">
                        Please enter your regex statement to exclude commits
                        with certain elements found in the commit messages.
                        <br />
                    </p>

                    <!-- Multiline input -->
                    <textarea
                        class="regex-textarea"
                        bind:value={regex_input}
                        placeholder="Enter your regex statement here..."
                    ></textarea>

                    <!-- Buttons -->
                    <div class="modal-button">
                        <ButtonTintedMedium
                            label="Cancel"
                            icon="x"
                            width="4rem"
                            onclick={() => {
                                regex_input = saved_regex;
                                show_regex_modal = false;
                            }}
                        />
                        {#if regex_input.length != 0}
                            <ButtonTintedMedium
                                label="Clear Regex Statement"
                                width="10rem"
                                icon="trash"
                                onclick={() => {
                                    regex_input = "";
                                }}
                            />
                        {/if}

                        <ButtonPrimaryMedium
                            label="Save"
                            icon="device-floppy"
                            onclick={save_regex}
                        />
                    </div>
                </div>
            {/snippet}
        </Modal>

        <!-- config btn -->
        <div class="config-btn heading-btn">
            {#if config_is_active}
                <ButtonPrimaryMedium
                    label="Config"
                    icon="settings-2"
                    onclick={() => {
                        show_config_modal = true;
                        config_error = false;
                        config_error_msg = "";
                    }}
                />
            {:else}
                <ButtonTintedMedium
                    label="Config"
                    icon="settings-2"
                    label_class="body-accent"
                    icon_first={true}
                    width="4rem"
                    onclick={() => {
                        show_config_modal = true;
                        config_error = false;
                        config_error_msg = "";
                    }}
                />
            {/if}
        </div>

        <!-- Config Modal -->
        <Modal bind:show_modal={show_config_modal}>
            {#snippet icon()}
                <Icon
                    icon={`tabler:settings-2`}
                    class="icon-medium"
                    style="color: currentColor"
                />
            {/snippet}
            {#snippet header()}
                Contributor Mapping
            {/snippet}

            {#snippet body()}
                <p class="label-primary body">
                    This is the current contributor mapping used. Upload a new
                    config file to group more email addresses to contributors.
                </p>
                <input
                    type="file"
                    bind:this={file_input}
                    style="display: none;"
                    onchange={handle_file_change}
                />

                <MappingDisplay {repo_url} />

                <div class="modal-button">
                    <ButtonTintedMedium
                        label="Cancel"
                        icon="x"
                        icon_first={true}
                        width="4rem"
                        onclick={() => (show_config_modal = false)}
                    />
                    {#if $manifest.repository.find((r) => r.url === repo_url)?.email_mapping}
                        <ButtonTintedMedium
                            label="Remove Mapping"
                            width="8rem"
                            icon="trash"
                            onclick={handle_remove_mapping}
                        />
                    {/if}
                    <ButtonPrimaryMedium
                        label="Upload"
                        icon="upload"
                        onclick={trigger_file_input}
                    />
                    <ErrorMessage
                        verification_message={config_error_msg}
                        error={config_error}
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
                label_class="body-accent"
                disabled={false}
                width={start_date && end_date ? "14rem" : "7rem"}
                on:change={handle_date_change}
            />
        </div>
    </div>

    <div class="heading-btn-spacer"></div>

    <span class="subtitle display-subtitle">Contribution Statistics</span>
</div>

<style>
    .page-header {
        display: flex;
        flex-direction: column;
        padding: 2rem 4rem;
    }

    .top-container {
        display: grid;
        grid-template-columns: 1fr auto auto auto auto auto;
        grid-template-areas:
            "repo-path regex config branch calendar"
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

    .subtitle {
        grid-area: subtitle;
    }

    .regex-btn {
        grid-area: regex;
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

    .heading-btn-spacer {
        grid-area: heading-btn-spacer;
        display: flex;
    }

    @media (max-width: 85rem) {
        .top-container {
            display: grid;
            grid-template-columns: auto auto auto auto auto 1fr;
            grid-template-areas:
                "repo-path repo-path repo-path repo-path repo-path"
                "subtitle subtitle subtitle subtitle subtitle"
                "regex config branch calendar heading-btn-spacer";
            align-items: center;
            column-gap: 1rem;
        }

        .heading-btn {
            padding-top: 1rem;
            min-width: 4rem;
            flex-shrink: 0;
        }
    }
    /* MODAL */
    .modal-button {
        display: flex;
        justify-content: center;
        gap: 1rem;
        margin-top: 1.5rem;
    }

    /* Fix: Prevent background scrolling when modal is open */
    :global(body.modal-open) {
        overflow: hidden;
    }

    .regex-textarea {
        width: 100%;
        min-height: 8rem;
        padding: 1rem;
        border-radius: 0.75rem;
        border: 1px solid var(--fill-03);
        background: var(--background-tertiary);
        color: var(--label-primary);
        font-size: 0.8rem;
        resize: vertical;
        box-sizing: border-box;
        transition:
            border 0.15s ease,
            background 0.15s ease,
            box-shadow 0.15s ease;
    }
    .regex-textarea:hover {
        border-color: var(--fill-02);
        background: var(--background-secondary);
    }

    .regex-textarea:focus {
        border-color: var(--accent-primary);
        background: var(--background-secondary);
        outline: none;
        box-shadow: 0 0 0 2px var(--accent-primary-10);
    }

    .regex-textarea::placeholder {
        color: var(--label-secondary);
        opacity: 0.7;
    }
</style>

<script lang="ts">
    import { sidebar_open, close_sidebar } from "$lib/stores/sidebar";
    import Icon from "@iconify/svelte";
    import ApiKeyField from "./APIKeyField.svelte";
    import { manifest, type ManifestSchema } from "$lib/stores/manifest";
    import { onMount } from "svelte";
    import { info, error } from "@tauri-apps/plugin-log";
    import { invoke } from "@tauri-apps/api/core";
    import { get_repo_info, get_source_type } from "$lib/github_url_verifier";
    import { set_repo_url } from "$lib/stores/repo";
    import { bare_clone, load_branches, load_commit_data } from "$lib/metrics";
    import { goto } from "$app/navigation";
    import { generate_state_object, save_state } from "$lib/utils/localstorage";
    import { page } from "$app/state";
    import { loading_state } from "$lib/stores/loading.svelte";


    interface RepoBookmark {
        repo_name: string;
        repo_url: string;
        repo_bookmarked: boolean;
        source_type: 0 | 1 | 2; // 0 = GitHub, 1 = GitLab, 2 = Local
    }
    onMount(async () => {
        try {
            let data = await invoke<ManifestSchema>("read_manifest");
            manifest.set(data);
            info("page", data);
        } catch (e: any) {
            let err = typeof e === "string" ? e : (e?.message ?? String(e));
            info("read_manifest failed", e);
        }
    });
    let bookmarked_repos: RepoBookmark[] = $derived(
        $manifest["repository"].map((item) => {
            return {
                repo_name: item.name,
                repo_url: item.url,
                repo_bookmarked: item.bookmarked,
                source_type: item.source_type,
            };
        })
    );
    let api_input = $state("");
    let api_error = $state(false);
    let api_err_desc = $state("");

    let bookmark_error = $state(false);
    let bookmark_err_desc = $state("");

    async function on_submit(): Promise<Boolean> {
        // Key validation
        info("Attempting to validate key");
        try {
            let is_valid_key = await invoke<Boolean>("gemini_key_validation", {
                apiKey: api_input,
            });

            // If key is valid, store securely
            if (is_valid_key) {
                info("Valid API Key");
                api_error = false;
                // Store key securely
            } else {
                // Else, prompt user to re-enter
                info("Invalid API Key");
                api_error = true;
                api_err_desc = "Invalid API Key. Please try again.";
            }
            return is_valid_key;
        } catch (err) {
            error("Failed to validate key: " + err);
            api_error = true;
            api_err_desc = "Error validating key. Please try again.";
            return false;
        }
    }

    async function bookmark_open(repo_url_input: string) {
        loading_state.loading = true;
        let source_type = get_source_type(repo_url_input);
        let repository_information: {
            source_type: 0 | 1 | 2;
            source: string;
            owner: string;
            repo: string;
        };

        try {
            if (source_type === 2) {
                let remote_url = await invoke<string>(
                    "get_local_repo_information",
                    { path: repo_url_input }
                );
                repository_information = get_repo_info(
                    remote_url.replace(".git", "")
                );
                repository_information.source_type = 2;
            } else {
                repository_information = get_repo_info(repo_url_input);
            }

            // Update the repo store with the new URL
            let repo_path: string;
            if (source_type === 2) {
                repo_path = repo_url_input;
            } else {
                set_repo_url(repo_url_input);
                try {
                    repo_path = await bare_clone(
                        repository_information.source,
                        repository_information.owner,
                        repository_information.repo,
                        source_type
                    );
                } catch (err: any) {
                    error(err);
                    const err_check = String(err);
                    if (err_check.includes("remote authentication required")) {
                        bookmark_err_desc =
                            "Repository is private and requires authentication (PAT) or the URL is incorrect.";
                    } else if (
                        err_check.includes("failed to resolve address")
                    ) {
                        bookmark_err_desc =
                            "Unable to reach Git repository. Please check Internet connection.";
                    } else if (err_check.includes("not found")) {
                        bookmark_err_desc =
                            "Repository not found. Please check the URL.";
                    } else {
                        bookmark_err_desc = "Unknown Error: " + err_check;
                    }
                    bookmark_error = true;
                    loading_state.loading = false;
                    return;
                }
            }
            // Call loadBranches and loadCommitData and wait for both to complete

            let branches = await load_branches(repo_path);

            let contributors = await load_commit_data(repo_path);

            const url_trimmed =
                source_type === 2
                    ? repo_url_input
                    : repository_information.source +
                      "/" +
                      repository_information.owner +
                      "/" +
                      repository_information.repo;

            await manifest.update_repository_timestamp(url_trimmed);
            await invoke("save_manifest", { manifest: $manifest });

            const working_dir = await invoke<string>("get_working_directory");
            let storage_obj = await generate_state_object(
                working_dir,
                repository_information,
                url_trimmed,
                source_type,
                branches,
                contributors
            );
            await save_state(storage_obj);

            // Navigate to the overview page
            if (window.location.pathname == "/overview-page") {
                await goto('/')
            }
            goto('/overview-page')
            loading_state.loading = false;
        } catch (error: any) {
            const error_message = error.message || "Verification failed";
            info("Failed to open bookmarked repo: " + error_message);

            // Since a private bookmarked repo shouldn't fail from PAT Token errors, we do not need to display the modal.
            // Or check for it even like in other areas.

            bookmark_error = true;
            bookmark_err_desc =
                "Failed to open bookmarked repository. Please try again.";
            loading_state.loading = false;
        }
    }

    async function delete_repository(
        repo_url_input: string,
        event: MouseEvent
    ) {
        event.stopPropagation(); // Prevent bookmark_open from being called

        try {
            let source_type = get_source_type(repo_url_input);
            const repository_information = get_repo_info(repo_url_input);

            const working_dir = await invoke<string>("get_working_directory");
            const repo_path = `${working_dir}/repositories/${source_type}-${repository_information.owner}-${repository_information.repo}`;

            info(`Deleting repository at: ${repo_path}`);
            await invoke("delete_repo", { path: repo_path });

            // Remove from manifest
            const url_trimmed =
                repository_information.source +
                "/" +
                repository_information.owner +
                "/" +
                repository_information.repo;

            const updated_manifest = {
                ...$manifest,
                repository: $manifest.repository.filter(
                    (item) => item.url !== url_trimmed
                ),
            };
            manifest.set(updated_manifest);
            await invoke("save_manifest", { manifest: updated_manifest });

            info("Repository deleted successfully");

            // Check if user is currently viewing this repository
            const current_state = page.state as any;
            if (current_state && current_state.repo_url === url_trimmed) {
                info(
                    "Currently viewing deleted repository, navigating to home"
                );
                goto("/");
            }
        } catch (e: any) {
            error("Failed to delete repository: " + e);
        }
    }
</script>

<div class={`sidebar-container ${$sidebar_open ? "open" : ""}`}>
    <div class="sidebar-backdrop" onclick={close_sidebar}></div>
    <div class={`sidebar ${$sidebar_open ? "open" : "closed"}`}>
        <div class="sidebar-header">
            <div class="sidebar-title">
                <Icon
                    icon="tabler:chart-line"
                    class="icon-large"
                    style="color: white"
                />
                <h1 class="title sidebar-title-text white">Settings</h1>
            </div>
            <button
                class="close-button btn-icon"
                onclick={close_sidebar}
                aria-label="Close sidebar"
            >
                <Icon
                    icon="tabler:x"
                    class="icon-medium"
                    style="color: inherit"
                />
            </button>
        </div>
        <div class="sidebar-item-container">
            <div class="header">
                <Icon
                    icon="tabler:sparkles"
                    class="icon-medium"
                    style="color: white"
                />
                <h2 class="heading-1 sidebar-item-header white">
                    AI integration
                </h2>
            </div>
            <div class="caption label-secondary">
                Add your Gemini API key to enable AI-powered features.
            </div>
            <ApiKeyField bind:api_input {on_submit} {api_error} />
            {#if api_error}
                <div class="caption error" style="margin-top: 0.25rem;">
                    {api_err_desc}
                </div>
            {/if}
        </div>
        <div class="sidebar-item-container">
            <div class="header">
                <Icon
                    icon="tabler:star-filled"
                    class="icon-medium"
                    style="color: white"
                />
                <h2 class="heading-1 sidebar-item-header white">Bookmarks</h2>
            </div>

            {#if bookmark_error}
                <div class="caption error" style="margin-top: 0.25rem;">
                    {bookmark_err_desc}
                </div>
            {/if}
            {#each bookmarked_repos as repo (repo.repo_url)}
                {#if repo.repo_bookmarked}
                    <div class="bookmark-wrapper">
                        <button
                            class="bookmark-item"
                            type="button"
                            onclick={() => {
                                bookmark_open(repo.repo_url);
                            }}
                        >
                            <h6 class="heading-2 repo-name label-secondary">
                                {repo.repo_name}
                            </h6>
                            <h6 class="caption repo-url label-secondary">
                                {repo.repo_url}
                            </h6>
                        </button>
                        {#if repo.source_type !== 2}
                            <button
                                class="delete-button"
                                type="button"
                                onclick={(e) =>
                                    delete_repository(repo.repo_url, e)}
                                aria-label="Delete repository"
                            >
                                <Icon
                                    icon="tabler:trash"
                                    class="icon-medium"
                                    style="color: var(--label-secondary)"
                                />
                            </button>
                        {/if}
                    </div>
                {/if}
            {/each}
        </div>
    </div>
</div>

<style>
    .sidebar-container {
        position: fixed;
        inset: 0;
        z-index: 200;
        pointer-events: none;
    }
    .sidebar-container.open {
        pointer-events: auto;
    }
    .sidebar-backdrop {
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.4);
        opacity: 0;
        transition: opacity 0.3s ease-in-out;
        pointer-events: none;
        z-index: 205;
    }
    .sidebar-container.open .sidebar-backdrop {
        opacity: 1;
        pointer-events: auto;
    }
    .sidebar {
        position: fixed;
        top: 0;
        right: 0;
        width: 18.4375rem;
        min-height: 93vh;
        padding: 2rem;
        border-radius: 8px 0 0 8px;
        border-top: solid var(--Label-Tertiary, #747474);
        border-bottom: solid var(--Label-Tertiary, #747474);
        border-left: solid var(--Label-Tertiary, #747474);
        border-width: 0.0625rem;
        background: var(--Background-Tint, rgba(34, 34, 34));
        backdrop-filter: blur(16px);
        box-shadow: 0 10px 15px rgba(0, 0, 0, 0.3);
        z-index: 210;
        transform: translateX(100%);
        transition: transform 0.5s ease-in-out;
    }
    .sidebar.open {
        transform: translateX(0);
    }
    .sidebar.closed {
        transform: translateX(100%);
    }
    .sidebar-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        margin-bottom: 1.5rem;
    }
    .sidebar-title {
        display: flex;
    }
    .sidebar-title-text {
        margin: auto 0 auto 0.375rem;
        height: 1.8125rem;
    }
    .close-button {
        cursor: pointer;
        background: none;
        border: none;
        padding: 0;
    }
    .sidebar-item-container {
        display: grid;
        grid-template-columns: 1fr;
        gap: 13px;
        padding: 0rem 0.375rem 1rem 0.375rem;
    }
    .header {
        display: flex;
        align-items: center;
        height: 22px;
        justify-content: flex-start;
    }
    .sidebar-item-header {
        padding: 0px 6px;
    }
    .bookmark-wrapper {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
    }
    .bookmark-item {
        display: flex;
        flex-direction: column;
        text-align: left;
        cursor: pointer;
        background: none;
        border: none;
        padding: 0rem;
        flex: 1;
    }
    .delete-button {
        cursor: pointer;
        background: none;
        border: none;
        padding: 0.25rem;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: opacity 0.2s ease;
        opacity: 0.7;
    }
    .delete-button:hover {
        opacity: 1;
    }
    .repo-name,
    .repo-url {
        margin: 0;
    }
    .label-secondary {
        color: var(--label-secondary);
    }
    .white {
        color: var(--white);
    }
</style>

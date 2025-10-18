<script lang="ts">
    import { invoke } from "@tauri-apps/api/core";
    import {
        get_source_type,
        get_repo_info,
    } from "$lib/github_url_verifier.js";
    import { bare_clone, load_branches, load_commit_data } from "$lib/metrics";
    import { goto } from "$app/navigation";
    import RepoDropdown from "$lib/components/global/RepoDropdown.svelte";
    import { repo_options } from "$lib/stores/repo";
    import type { RepoOption } from "$lib/stores/repo";
    import { set_repo_url } from "$lib/stores/repo";
    import ErrorMessage from "$lib/components/global/ErrorMessage.svelte";
    import RepoSearchbar from "$lib/components/global/RepoSearchbar.svelte";
    import Banner from "$lib/components/overview-page/Banner.svelte";
    import Sidebar from "$lib/components/global/Sidebar.svelte";
    import RepoBookmarkList from "$lib/components/global/RepoBookmarkList.svelte";
    import AccessTokenModal from "$lib/components/global/AccessTokenModal.svelte";
    import { auth_error, retry_clone_with_token } from "$lib/stores/auth";
    import { generate_state_object, save_state } from "$lib/utils/localstorage";
    import { onMount } from "svelte";
    import { manifest, type ManifestSchema } from "$lib/stores/manifest";
    import { info, error } from "@tauri-apps/plugin-log";
    import LoadingIndicator from "$lib/components/global/LoadingIndicator.svelte";

    // only run on the browser
    onMount(async () => {
        try {
            let data = await invoke<ManifestSchema>("read_manifest");
            manifest.set(data);
            info("page " + JSON.stringify(data));
        } catch (e: any) {
            let err = typeof e === "string" ? e : (e?.message ?? String(e));
            error("read_manifest failed: " + err);
        }
    });

    let loading: boolean = $state(false);

    interface RepoBookmark {
        repo_name: string;
        repo_url: string;
        repo_bookmarked: boolean;
    }

    let recent_repos: RepoBookmark[] = $derived(
        $manifest["repository"].map((item) => {
            return {
                repo_name: item.name,
                repo_url: item.url,
                repo_bookmarked: item.bookmarked,
            };
        })
    );

    let selected: RepoOption = $state(repo_options[2]); // Default to Local

    $effect(() => {
        if (repo_url_input.trim() !== "") {
            selected = repo_options[get_source_type(repo_url_input)];
        }
    });
    let repo_url_input: string = $state("");

    let verification_message: string = $state("");
    let verification_error: boolean = $state(false);
    let waiting_for_auth: boolean = $state(false);

    async function select_bookmarked_repo(repo_url: string) {
        repo_url_input = repo_url;
        await handle_verification();
    }

    function reset_verification_result() {
        verification_message = "";
        verification_error = false;
    }

    // Subscribe to auth errors to show modal when needed
    let show_modal = $derived($auth_error.needs_token);

    // Track previous modal state to detect when modal closes
    let previous_show_modal = $state(false);

    // Clear verification message when modal closes without using Add button
    $effect(() => {
        if (previous_show_modal && !show_modal && !verification_error) {
            // Modal was open and is now closed, and we don't have an error
            // This means the user closed the modal by clicking outside
            verification_message = "";
            // waiting_for_auth = false;
        }
        previous_show_modal = show_modal;
    });

    async function handle_token_add(token: string) {
        loading = true;
        // Validate that token is not empty
        if (!token || token.trim().length === 0) {
            info("No token entered, keeping modal open");
            verification_message = "Please enter a Personal Access Token";
            verification_error = true;
            return;
        }

        info("Authenticating with Personal Access Token...");

        try {
            // Attempt to clone with the provided token
            const success = await retry_clone_with_token(token);

            if (success) {
                info(
                    "Authentication successful, continuing repository loading..."
                );
                waiting_for_auth = false;
                // The modal will be hidden automatically by the auth store
                // The repository should now be accessible, so we can continue with the normal flow
                // Re-trigger the verification process to load the now-accessible repository
                await handle_verification();
            } else {
                info("Authentication failed, please check your token");
                // Show user-friendly error message above search bar and close modal
                verification_message =
                    "Access token/URL is invalid. Please check your token/URL and try again.";
                verification_error = true;
                waiting_for_auth = false;
                // Hide the modal since we're showing the error above the search bar
                auth_error.set({
                    needs_token: false,
                    message: "",
                });
            }
        } catch (err) {
            error("Error during token validation: " + err);
            verification_message =
                "An error occurred during authentication. Please try again.";
            verification_error = true;
            waiting_for_auth = false;
            // Hide the modal since we're showing the error above the search bar
            auth_error.set({
                needs_token: false,
                message: "",
            });
        }
        loading = false;
    }

    function update_progress(progress: string) {
        info(progress);
    }

    async function local_verification() {
        await invoke("get_local_repo_information", { path: repo_url_input });
        info("Local repo selected, skipping verification.");
    }

    async function handle_verification() {
        loading = true;
        info(
            "handleVerification called with: " + repo_url_input + " " + selected
        );
        reset_verification_result();

        if (!repo_url_input.trim()) {
            verification_error = true;
            verification_message = "Please enter a URL/path.";
            return;
        }

        let source_type = get_source_type(repo_url_input);

        let repository_information: {
            source_type: 0 | 1 | 2;
            source: string;
            owner: string;
            repo: string;
        };
        try {
            if (
                !repo_url_input.startsWith("/") &&
                !repo_url_input.startsWith("C:\\") &&
                !repo_url_input.startsWith("https://")
            ) {
                verification_error = true;
                verification_message =
                    "Please enter a valid URL/path. (Prefix with https:// or /)";
                loading = false;
                return;
            }

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
                        verification_message =
                            "Repository is private and requires authentication (PAT) or the URL is incorrect.";
                    } else if (
                        err_check.includes("failed to resolve address")
                    ) {
                        verification_message =
                            "Unable to reach Git repository. Please check Internet connection.";
                    } else if (err_check.includes("not found")) {
                        verification_message =
                            "Repository not found. Please check the URL.";
                    } else {
                        verification_message = "Unknown Error: " + err_check;
                    }
                    verification_error = true;
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
            // Check if the repository exists in the manifest
            const repo_exists = $manifest["repository"].some(
                (item) =>
                    item.url === url_trimmed && item.source_type === source_type
            );

            if (!repo_exists) {
                await manifest.create_repository(
                    repository_information,
                    url_trimmed,
                    source_type,
                    repo_path
                );
            }

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
            goto(`/overview-page`);
        } catch (error: any) {
            loading = false;
            const error_message = error.message || "Verification failed.";
            error("Verification failed: " + error);

            // Check if this is an authentication error that requires a token
            if (error_message.includes("private and requires authentication")) {
                info("Authentication required, showing modal");
                loading = false;
                waiting_for_auth = true;
                // The modal will show automatically via the auth store
                // Don't set verification_error here - we're waiting for user input
                return;
            } else {
                // This is a different kind of error
                verification_error = true;
                verification_message = error_message;
            }
        }
    }
</script>

<div class="page">
    {#if loading}
        <LoadingIndicator />
    {/if}
    <header class="header">
        <Banner />
    </header>

    <main class="main">
        <div class="repo-menu">

            <!-- Verification Feedback -->
            <div class="align-with-searchbar">
                <ErrorMessage
                    {verification_message}
                    error={verification_error}
                />
            </div>

            <!-- Repo dropdown -->
            <RepoDropdown bind:selected action={reset_verification_result} />

            <!-- Repo link -->
            <RepoSearchbar
                on_submit={handle_verification}
                bind:repo_url_input
                error={verification_error}
            />

            <!-- Repo link list -->
            <RepoBookmarkList
                bookmarked_repos={recent_repos}
                onclick={select_bookmarked_repo}
            />

        </div>



    </main>
</div>

<Sidebar />

<!-- Access Token Modal -->
<AccessTokenModal bind:show_modal on_token_add={handle_token_add} />

<style>
    .align-with-searchbar {
        padding-left: 1.5rem;
        padding-right: 1.5rem;
    }

    .main {
        height: calc(100vh - 3.5rem);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 500;
    }

    .repo-menu {
        display: grid;
        grid-template-rows: auto auto auto; /* 3 rows for dropdown, input, feedback */
        justify-content: center;
        align-items: center;
        row-gap: 10px;
    }
</style>

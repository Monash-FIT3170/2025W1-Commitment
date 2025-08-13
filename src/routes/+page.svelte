<script lang="ts">
    import { invoke } from "@tauri-apps/api/core";
    import { verify_and_extract_source_info } from "$lib/github_url_verifier.js";
    import Icon from "@iconify/svelte";
    import { load_branches, load_commit_data } from "$lib/metrics";
    import { goto } from "$app/navigation";
    import { get_repo_type } from "$lib/repo";
    import RepoDropdown from "$lib/components/global/RepoDropdown.svelte";
    import { repo_options } from "$lib/stores/repo";
    import type { RepoOption } from "$lib/stores/repo";
    import { set_repo_url } from "$lib/stores/repo";
    import ErrorMessage from "$lib/components/global/ErrorMessage.svelte";
    import RepoSearchbar from "$lib/components/global/RepoSearchbar.svelte";
    import Banner from "$lib/components/overview-page/Banner.svelte";
    import Sidebar from "$lib/components/global/Sidebar.svelte";
    import RepoBookmarkList from "$lib/components/global/RepoBookmarkList.svelte";

    interface RepoBookmark {
        repo_name: string;
        repo_url: string;
    }

    let profile_image_url = "/mock_profile_img.png";
    let username = "Baaset Moslih";

    let bookmarked_repos: RepoBookmark[] = [
        {
            repo_name: "GitGuage",
            repo_url: "https://github.com/Monash-FIT3170/2025W1-Commitment",
        },
        {
            repo_name: "QualAI",
            repo_url: "https://github.com/Monash-FIT3170/2025W1-QualAI",
        },
        {
            repo_name: "PressUp",
            repo_url: "https://github.com/Monash-FIT3170/2025W1-PressUp",
        },
        {
            repo_name: "FindingNibbles",
            repo_url: "https://github.com/Monash-FIT3170/2025W1-FindingNibbles",
        },
    ];

    let selected: RepoOption = $state(repo_options[0]); // Default to GitHub

    let repo_url_input: string = $state("");

    let verification_message: string = $state("");
    let verification_error: boolean = $state(false);

    interface BackendVerificationResult {
        owner: string;
        repo: string;
    }

    async function select_bookmarked_repo(repo_url: string) {
        repo_url_input = repo_url;
        handle_verification();
    }

    function reset_verification_result() {
        verification_message = "";
        verification_error = false;
    }

    async function handle_verification() {
        console.log(
            "handleVerification called with:",
            repo_url_input,
            selected,
        );
        reset_verification_result();

        if (!selected || !repo_url_input.trim()) {
            verification_error = true;
            verification_message =
                "Please select a source type and enter a URL/path.";
            return;
        }

        try {
            // Try frontend validation first
            const result = verify_and_extract_source_info(
                repo_url_input,
                selected.source_type,
            );

            const backend_result = await invoke<BackendVerificationResult>(
                "verify_and_extract_source_info",
                {
                    urlStr: repo_url_input,
                    sourceType: selected.source_type,
                },
            );

            verification_message = `Successfully verified! Owner: ${backend_result.owner}, Repo: ${backend_result.repo}`;

            // Update the repo store with the new URL
            set_repo_url(repo_url_input);
            // Call loadBranches and loadCommitData and wait for both to complete
            const contributors = await load_commit_data(
                backend_result.owner,
                backend_result.repo,
            );
            const branches = await load_branches(backend_result.repo);

            // Navigate to the overview page
            goto(`/overview-page`, {
                state: {
                    repo_url: repo_url_input,
                    repo_path: new URL(repo_url_input).pathname.slice(1),
                    repo_type: get_repo_type(repo_url_input),
                    branches: branches,
                    contributors: contributors,
                },
            });
        } catch (error: any) {
            verification_error = true;
            verification_message = `${error.message || "Verification failed."}`;
            console.error("Verification failed:", error);
        }
    }
</script>

<div class="page">
    <header class="header">
        <Banner {username} {profile_image_url} />
    </header>

    <main class="main">
        <div class="repo-menu">
            <div></div>

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

            <div></div>

            <!-- Repo link list -->
            <RepoBookmarkList
                {bookmarked_repos}
                onclick={select_bookmarked_repo}
            />
        </div>
    </main>
</div>
<Sidebar />

<style>
    .align-with-searchbar {
        padding-left: 1.5rem;
        padding-right: 1.5rem;
    }

    .main {
        height: calc(100vh - 4.1875rem);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 500;
    }

    .repo-menu {
        display: grid;
        grid-template-columns: 13rem 35.5rem; /* 2 columns */
        grid-template-rows: auto auto auto; /* 3 rows for dropdown, input, feedback */
        column-gap: 1rem;
        row-gap: 10px;
    }
</style>

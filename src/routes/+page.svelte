<script lang="ts">
    import { invoke } from "@tauri-apps/api/core";
    import ErrorMessage from "$lib/components/global/ErrorMessage.svelte";
    import { verifyAndExtractSourceInfo } from "$lib/githubUrlVerifier.js";
    import Icon from "@iconify/svelte";
    import { load_branches, load_commit_data } from "$lib/metrics";
    import { goto } from "$app/navigation";
    import { setRepoUrl } from "$lib/stores/repo";
    import RepoDropdown from "$lib/components/global/RepoDropdown.svelte";
    import type { RepoOption } from "$lib/stores/repo";
    import { repo_options } from "$lib/stores/repo";
    import RepoSearchbar from "$lib/components/global/RepoSearchbar.svelte";
    import Banner from "$lib/components/overview-page/Banner.svelte";
    import UserMenu from "$lib/components/overview-page/UserMenu.svelte";
    import Sidebar from "$lib/components/global/Sidebar.svelte";

    interface RepoBookmark {
        repo_name: string;
        repo_url: string;
    }

    let sidebarOpen = $state(false);
    let profileImageURL = "/mock_profile_img.png";
    let userName = "Baaset Moslih";

    let selected: RepoOption = $state(repo_options[0]); // Default to GitHub
    let repoUrlInput: string = $state("");

    let verification_message: string = $state("");
    let verification_error: boolean = $state(false);

    function resetVerificationResult() {
        verification_message = "";
        verification_error = false;
    }

    interface BackendVerificationResult {
        owner: string;
        repo: string;
    }

    let bookmarked_repo: RepoBookmark[] = [
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
            repo_url: "https://github.com/Monash-FIT3170/2025W1-PressUp"
        },
        {
            repo_name: "FindingNibbles",
            repo_url: "https://github.com/Monash-FIT3170/2025W1-FindingNibbles"
        }

    ];

    async function bookmarkedRepo(repoUrl: string) {
        repoUrlInput = repoUrl;
        handleVerification();
    }

    async function handleVerification() {
        console.log("handleVerification called with:", repoUrlInput, selected);
        resetVerificationResult();
        
        if (!selected || !repoUrlInput.trim()) {
            verification_error = true;
            verification_message =
                "Please select a source type and enter a URL/path.";
            return;
        }

        try {
            // Try frontend validation first
            const result = verifyAndExtractSourceInfo(repoUrlInput, selected.source_type);

            const backendResult = await invoke<BackendVerificationResult>(
                "verify_and_extract_source_info",
                {
                    urlStr: repoUrlInput,
                    sourceType: selected.source_type,
                },
            );

            verification_message =
                `Successfully verified! Owner: ${backendResult.owner}, Repo: ${backendResult.repo}`
        
            // Update the repo store with the new URL
            setRepoUrl(repoUrlInput);
            // Call loadBranches and loadCommitData and wait for both to complete
            const [branches, commitData] = await Promise.all([
                load_branches(backendResult.owner, backendResult.repo),
                load_commit_data(backendResult.owner, backendResult.repo),
            ]);

            // Navigate to the overview page
            goto(`/overview-page`, {
                state: {
                    branches: branches,
                    commitData: commitData,
                },
            });
        } catch (error: any) {
            verification_error = true
            verification_message = `${error.message || "Verification failed."}`
            console.error("Verification failed:", error);
        }
    }

</script>
<div class="page">

    <header class="header">
        <Banner/>
        <UserMenu {userName} {profileImageURL} />
    </header>
    
    <main class="main">

        <div class="repo-start">
            <div></div>

             <!-- Verification Feedback -->
            <div class="align-with-searchbar">
                <ErrorMessage
                    verification_message={verification_message}
                    error={verification_error}
                />
            </div>

            <!-- Repo dropdown -->
            <RepoDropdown bind:selected={selected} action={resetVerificationResult}/>
        
            <!-- Repo link -->
             <RepoSearchbar onSubmit={handleVerification} bind:repoUrlInput={repoUrlInput} error={verification_error}></RepoSearchbar>

            <div></div>
    
            <!-- Repo link list -->
            <div class="repo-bookmark-list align-with-searchbar">
                {#each bookmarked_repo as bookmark (bookmark.repo_url)}
                    <button class="repo-list-btn" type="button" onclick={() => bookmarkedRepo(bookmark.repo_url)}>
                        <h6 class="display-body repo-list-text">
                            {bookmark.repo_url}
                        </h6>
                    </button>
                {/each}
            </div>
        </div>
    </main>
    <Sidebar/>
</div>

<style>
    .align-with-searchbar {
        padding-left: 1.5rem;
        padding-right: 1.5rem;
    }

    .header {
    padding-left: 2rem;
    padding-right: 2rem;
    padding-top: 2rem;
    margin-bottom: 0.8125rem;
    height: 1.375rem;
    display: flex;
    justify-content: space-between;
}

    /* MAIN PAGE CONTENT */
    .main {
        height: calc(100vh - 4.1875rem);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 500;
    }

    /* REPO SECTION */
    .repo-start {
        /* width: ; */
        display: grid;
        grid-template-columns: 13rem 35.5rem; /* 2 columns */
        column-gap: 1rem;
        row-gap: 10px;
    }

    /* Repo link list */
    .repo-bookmark-list {
        background: transparent;
        margin: 0px;
        /* width: 693px; */
        display: grid;
        grid-template-columns: 32.5rem;
        grid-template-rows: repeat(5);
        row-gap: 1rem;

        /* let the list overflow and can be scrolll */
        max-height: 10.875rem; /* adjust height to fit your layout */
        overflow-y: auto; /* enables vertical scrolling */
        overflow-x: hidden;
        scroll-padding-bottom: 10.875rem;

        scrollbar-width: none;
        -ms-overflow-style: none;

        -webkit-mask-image: linear-gradient(
            to bottom,
            black 0%,
            rgba(0, 0, 0, 0.2) 80%,
            transparent 100%
        );
        mask-image: linear-gradient(
            to bottom,
            black 0%,
            rgba(0, 0, 0, 0.2) 80%,
            transparent 100%
        );
        mask-size: 100% 100%;
        mask-repeat: no-repeat;
    }

    .repo-list-btn {
        height: 22px;
        width: inherit;
        background-color: transparent; /*#181818; */
        border: none;
        text-align: left;
        cursor: pointer;
        padding: 0rem
    }

    .repo-list-text {
        height: inherit;
        margin: 0px;
        color: var(--label-primary);
    }
</style>


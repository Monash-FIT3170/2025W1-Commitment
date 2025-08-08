<script lang="ts">
    import { invoke } from "@tauri-apps/api/core";
    import ErrorMessage from "$lib/components/global/ErrorMessage.svelte";
    import { verifyAndExtractSourceInfo } from "$lib/githubUrlVerifier.js";
    import Icon from "@iconify/svelte";
    import { load_branches, load_commit_data } from "$lib/metrics";
    import { redirect } from "@sveltejs/kit";
    import { goto } from "$app/navigation";
    import { setRepoUrl } from "$lib/stores/repo";
    import RepoDropdown from "$lib/components/global/RepoDropdown.svelte";
    import type { RepoOption } from "$lib/stores/repo";
    import { repo_options } from "$lib/stores/repo";
    import RepoSearchbar from "$lib/components/global/RepoSearchbar.svelte";

    interface RepoBookmark {
        repo_name: string;
        repo_url: string;
    }

    let sidebarOpen = $state(false);
    let profileImageURL = "/mock_profile_img.png";
    let userName = "Baaset Moslih";

    function toggleSidebar() {
        sidebarOpen = !sidebarOpen;
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

    <header>
        <div class="container">
            <div class="header-content">
                <div class="logo-section">
                    <a href="/" class="cursor-pointer">
                        <img
                            class="logo-img"
                            src="/secondary_logo.png"
                            alt="Your Company"
                        />
                    </a>
                </div>
    
                <div class="user-section">
                    <h6 class="white body-accent">{userName}</h6>
                    <img src={profileImageURL} alt="Profile" class="profile-img" />
    
                    <button
                        type="button"
                        class="hamburger-btn"
                        onclick={toggleSidebar}
                    >
                        <Icon
                            icon={"tabler:menu-2"}
                            class="icon-medium"
                            style="color: white"
                        />
                    </button>
                </div>
            </div>
        </div>
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
             <RepoSearchbar onSubmit={handleVerification} bind:repoUrlInput={repoUrlInput}></RepoSearchbar>

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
    
    <!-- Sidebar -->
    <div class={`sidebar ${sidebarOpen ? "open" : "closed"}`}>
        <div class="sidebar-header">
            <div class="sidebar-title">
                <Icon
                    icon={"tabler:chart-line"}
                    class="icon-large"
                    style="color: white"
                />
                <h1 class="title sidebar-title-text white">settings</h1>
            </div>
            <button class="close-button" onclick={toggleSidebar}>
                <Icon icon={"tabler:x"} class="icon-medium" style="color: white" />
            </button>
        </div>
    
        <div class="bookmark-list">
            <div class="bookmark-header">
                <Icon
                    icon={"tabler:star-filled"}
                    class="icon-medium"
                    style="color: white"
                />
                <h2 class="heading-1 bookmark-text white">bookmarks</h2>
            </div>
    
            {#each bookmarked_repo as repo (repo.repo_url)}
                <button class="bookmark-item" type="button" onclick={() => bookmarkedRepo(repo.repo_url)}>
                    <h6 class="heading-2 repo-name label-secondary">
                        {repo.repo_name}
                    </h6>
                    <h6 class="caption repo-url label-secondary">
                        {repo.repo_url}
                    </h6>
                </button>
            {/each}
        </div>
    </div>
</div>

<style>
    .align-with-searchbar {
        padding-left: 1.5rem;
        padding-right: 1.5rem;
    }
    /* MAIN PAGE CONTENT */
    .main {
        height: calc(100vh - 4.1875rem);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 500;
    }

    /* HEADER */
    .container {
        padding: 0px;
        margin-left: 2rem;
        margin-right: 2rem;
        margin-top: 2rem;
        margin-bottom: 0.8125rem;
        z-index: 500;

    }

    .header-content {
        position: relative;
        display: flex;
        height: 1.375rem;
        align-items: center;
        justify-content: space-between;
        z-index: 500;

    }

    .logo-section {
        display: flex;
        z-index: 500;

    }

    .logo-img {
        height: 20px;
        width: auto;
        z-index: 500;

    }

    .user-section {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding-top: 8px;
        padding-bottom: 8px;
        z-index: 500;

    }

    .label-secondary {
        color: var(--label-secondary);
        z-index: 500;

    }

    .profile-img {
        height: 1.375rem;
        width: 1.375rem;
        margin-left: 0.8125rem;
        margin-right: 0.8125rem;
        object-fit: cover;
        z-index: 500;

    }

    .hamburger-btn {
        cursor: pointer;
        background: none;
        border: none;
        padding: 0;
        height: 1.375rem;
        width: 1.375rem;
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 500;

    }

    /* SIDEBAR */
    .sidebar {
        position: fixed;
        top: 0;
        right: 0;
        width: 18.4375rem;
        height: 100%;
        padding: 2rem;
        border-radius: 8px 0px 0px 8px;
        border-top: solid var(--Label-Tertiary, #747474);
        border-bottom: solid var(--Label-Tertiary, #747474);
        border-left: solid var(--Label-Tertiary, #747474);
        border-width: 0.0625rem;
        background: var(--Background-Tint, rgba(34, 34, 34, 0.7));
        backdrop-filter: blur(16px);
        box-shadow: 0 10px 15px rgba(0, 0, 0, 0.3);
        z-index: 5000;
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
        height: 1.8125rem;
        margin-bottom: 1.5rem;
    }

    .sidebar-title {
        display: flex;
        height: 29px;
    }

    .sidebar-title-text {
        margin: auto;
        margin-left: 0.375rem;
        height: 1.8125rem;
    }

    .close-button {
        cursor: pointer;
        background: none;
        border: none;
        padding: 0;
    }

    .bookmark-list {
        display: grid;
        grid-template-columns: 1fr;
        gap: 13px;
    }

    .bookmark-header {
        display: flex;
        align-items: center;
        height: 22px;
    }

    .bookmark-text {
        padding-left: 6px;
    }

    .bookmark-item {
        display: flex;
        flex-direction: column;
        text-align: left;
        cursor: pointer;
        background: none;
        border: none;
        padding: 0;
    }

    .repo-name,
    .repo-url {
        margin-top: 0px;
        margin-bottom: 0px;
    }

    /* REPO SECTION */
    .repo-start {
        /* width: ; */
        display: grid;
        grid-template-columns: 13rem 35.5rem; /* 2 columns */
        column-gap: 1rem;
        row-gap: 10px;
    }

    /* REPO TEXTBOX */
    .repo-link {
        height: 1.5rem;
        width: 33rem;
        display: flex;
        justify-content: start;
        align-items: center;
        background-color: #222;
        padding: 0.5625rem 1.125rem 0.5625rem 1.5rem;
        border-radius: 12px;
    }

    .repo-textbox {
        flex: 1;
        margin-right: 0.5rem;
        background-color: #222;
        border: none;
        height: 24px;
        padding: 0px;
        width: 350px;
        color: white;
    }

    .repo-textbox::placeholder {
        font-size: 1.063rem;
        font-family: DM Sans;
        font-weight: 400;
        word-wrap: break-word;
    }

    .repo-textbox:focus {
        outline: none;
    }

    .repo-button {
        background-color: inherit;
        border: none;
        padding: 0px;
        cursor: pointer;
        display: flex;
        align-items: center;
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


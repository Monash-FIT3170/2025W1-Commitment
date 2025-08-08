<script lang="ts">
    import { invoke } from "@tauri-apps/api/core";
    import { verify_and_extract_source_info } from "$lib/github_url_verifier.js";
    import Icon from "@iconify/svelte";
    import { load_branches, load_commit_data } from "$lib/metrics";
    import { goto } from "$app/navigation";
    import { get_repo_type } from "$lib/repo";
    interface RepoBookmark {
        repo_name: string;
        repo_url: string;
    }

    let sidebar_open = false;
    let profile_image_url = "/mock_profile_img.png";
    let user_name = "Baaset Moslih";

    function toggle_sidebar() {
        sidebar_open = !sidebar_open;
    }

    let bookmarked_repos: RepoBookmark[] = [];
    (async () => {
        bookmarked_repos = await invoke<RepoBookmark[]>("get_bookmarked_repositories", {})
            .catch((error) => {
                console.error("Failed to fetch bookmarked repositories:", error);
                return [];
            });
    })();

    interface RepoOption {
        label: string;
        icon: string;
    }

    let dropdown_open = false;

    const options: RepoOption[] = [
        { label: "GitHub", icon: "brand-github" },
        { label: "GitLab", icon: "brand-gitlab" },
        { label: "Local", icon: "folder-code" },
    ];

    let selected: RepoOption = options[0]; // Default to GitHub

    let repo_url_input: string = "";
    let verification_result: { owner: string; repo: string } | null = null;
    let verification_error: string | null = null;
    let branch_selected: string | undefined = undefined;

    interface BackendVerificationResult {
        owner: string;
        repo: string;
        source_type: 0 | 1 | 2;
    }

    async function bookmarked_repo(repo_url: string) {
        repo_url_input = repo_url;
        handle_verification();
    }

    async function handle_verification() {
        if (!selected || !repo_url_input.trim()) {
            verification_error =
                "Please select a source type and enter a URL/path.";
            verification_result = null;
            return;
        }

        let source_type: 0 | 1 | 2;
        if (selected.label === "GitHub") {
            source_type = 0;
        } else if (selected.label === "GitLab") {
            source_type = 1;
        } else if (selected.label === "Local") {
            source_type = 2;
        } else {
            verification_error = "Invalid source type selected.";
            verification_result = null;
            return;
        }

        try {
            // Try frontend validation first
            const result = verify_and_extract_source_info(
                repo_url_input,
                source_type,
            );
            const backend_result = await invoke<BackendVerificationResult>(
                "verify_and_extract_source_info",
                {
                    urlStr: repo_url_input,
                    sourceType: source_type,
                },
            );
            verification_result = {
                owner: backend_result.owner,
                repo: backend_result.repo,
            };

            verification_error = null;

            // Call loadBranches and loadCommitData and wait for both to complete
            const contributors = await load_commit_data(backend_result.owner, backend_result.repo, backend_result.source_type);
            const branches = await load_branches(backend_result.repo);

            // Navigate to the overview page
            goto(`/overview-page`, {
                state: {
                    repo_url: repo_url_input,
                    repo_path: new URL(repo_url_input).pathname.slice(1),
                    repo_type: get_repo_type(repo_url_input),
                    selected_branch: "",
                    branches: branches,
                    contributors: contributors,
                },
            });
        } catch (error: any) {
            verification_error =
                error.message || `Verification failed: ${error}`;
            verification_result = null;
            console.error("Verification failed:", error);
        }
    }

    function select_option(option: RepoOption) {
        selected = option;
        dropdown_open = false;
        // Reset verification status when option changes
        verification_result = null;
        verification_error = null;
    }

    function toggle_dropdown() {
        dropdown_open = !dropdown_open;
    }

    function handle_input_keydown(event: KeyboardEvent) {
        if (event.key === "Enter") {
            handle_verification();
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
                    <h6 class="white body-accent">{user_name}</h6>
                    <img
                        src={profile_image_url}
                        alt="Profile"
                        class="profile-img"
                    />

                    <button
                        type="button"
                        class="hamburger-btn"
                        onclick={toggle_sidebar}
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
            <!-- Repo dropdown -->
            <div class="dropdown">
                <button
                    type="button"
                    class={`dropdown-btn ${dropdown_open ? "show" : "hide"}`}
                    onclick={toggle_dropdown}
                >
                    {#if selected}
                        <div class="dropdown-show">
                            <Icon
                                icon={`tabler:${selected.icon}`}
                                class="icon-medium"
                                style="color: white"
                            />
                            <h6 class="display-body white dropdown-text">
                                {selected.label}
                            </h6>
                        </div>
                    {:else}
                        <!-- This case should not happen with a default selected value -->
                        <h6 class="display-body white">Select an option</h6>
                    {/if}
                        <Icon
                            icon={`tabler:chevron-down`}
                            class="icon-medium"
                            style="color: white"
                        />
                </button>

                {#if dropdown_open}
                    <div class="dropdown-content">
                        {#each options as option}
                            <button
                                class="dropdown-option"
                                onclick={() => select_option(option)}
                            >
                                <Icon
                                    icon={`tabler:${option.icon}`}
                                    class="icon-medium"
                                    style="color: white"
                                />
                                <h6 class="display-body white dropdown-text">
                                    {option.label}
                                </h6>
                            </button>
                        {/each}
                    </div>
                {/if}
            </div>

            <!-- Repo link -->
            <div class="repo-link">
                <input
                    class="repo-textbox display-body"
                    type="text"
                    placeholder="Enter a link to a remote repository or a path to a local one..."
                    bind:value={repo_url_input}
                    onkeydown={handle_input_keydown}
                />
                <button class="repo-button" onclick={handle_verification}>
                    <Icon
                        icon={"tabler:circle-arrow-right"}
                        class="icon-medium"
                        style="color: white"
                    />
                </button>
            </div>

            <!-- Verification Feedback -->
            <div class="verification-feedback">
                {#if verification_result}
                    <p class="success-message white">
                        Successfully verified! Owner: {verification_result.owner},
                        Repo: {verification_result.repo}
                    </p>
                {/if}
                {#if verification_error}
                    <p class="error-message white">{verification_error}</p>
                {/if}
            </div>

            <!-- Repo link list -->
            <div class="repo-bookmark-list">
                {#each bookmarked_repos as bookmark (bookmark.repo_url)}
                    <button
                        class="repo-list-btn"
                        type="button"
                        onclick={() => bookmarked_repo(bookmark.repo_url)}
                    >
                        <h6 class="display-body repo-list-text white">
                            {bookmark.repo_url}
                        </h6>
                    </button>
                {/each}
            </div>
        </div>
    </main>

    <!-- Sidebar -->
    <div class={`sidebar ${sidebar_open ? "open" : "closed"}`}>
        <div class="sidebar-header">
            <div class="sidebar-title">
                <Icon
                    icon={"tabler:chart-line"}
                    class="icon-large"
                    style="color: white"
                />
                <h1 class="title sidebar-title-text white">settings</h1>
            </div>
            <button class="close-button" onclick={toggle_sidebar}>
                <Icon
                    icon={"tabler:x"}
                    class="icon-medium"
                    style="color: white"
                />
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

            {#each bookmarked_repos as repo (repo.repo_url)}
                <button
                    class="bookmark-item"
                    type="button"
                    onclick={() => bookmarked_repo(repo.repo_url)}
                >
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

    .white {
        color: var(--white);
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
        grid-template-rows: auto auto auto; /* 3 rows for dropdown, input, feedback */
        column-gap: 1rem;
        row-gap: 10px;
    }

    /* REPO DROPDOWN */
    .dropdown {
        position: relative;
        width: 13rem;
        height: 2.625em;
        border-top-left-radius: 12px;
        border-top-right-radius: 12px;
    }

    .dropdown-btn {
        width: 100%;
        height: inherit;
        padding: 0.625rem 0.75rem 0.625rem 1rem;
        background: #222;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    .dropdown-btn.hide {
        border-radius: 12px;
    }

    .dropdown-btn.show {
        border-top-left-radius: 12px;
        border-top-right-radius: 12px;
    }

    .dropdown-btn.show::after {
        content: "";
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        height: 1px;
        background-color: #fff;
    }

    .dropdown-show {
        display: flex;
        align-items: center;
    }

    .dropdown-content {
        width: inherit;
        background-color: #222;
        border-bottom-left-radius: 12px;
        border-bottom-right-radius: 12px;
    }

    .dropdown-option {
        width: inherit;
        height: 42px;
        padding: 0.625rem 0.75rem 0.625rem 1rem;
        background: #222;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: start;
        border-bottom-left-radius: 12px;
        border-bottom-right-radius: 12px;
    }

    .dropdown-text {
        margin-left: 0.5rem;
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
        grid-column: 2;
        grid-row: 2;
        padding-left: 1.5rem;
        padding-right: 1.5rem;
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
        /* padding-bottom: 84px;  */
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
        margin: none;
        padding: 0.5rem;
        text-align: left;
        cursor: pointer;
    }

    .repo-list-text {
        height: inherit;
        margin: 0px;
    }

    .verification-feedback {
        grid-column: 1 / -1; /* Span across both columns */
        /* Add some margin or padding if needed */
        margin-top: 5px;
    }

    .success-message {
        color: var(--accent-primary); /* Or your desired success color */
        font-size: 0.875rem;
    }

    .error-message {
        color: var(--functional-red-100); /* Or your desired error color */
        font-size: 0.875rem;
    }
</style>

<script lang="ts">
    import { invoke } from "@tauri-apps/api/core";
    import Icon from "@iconify/svelte";
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';
    let inputRepo = '';
  
    interface RepoBookmark {
      repo_name: string,
      repo_url: string
    }
  
    let sidebarOpen = false;
    let profileImageURL = "/mock_profile_img.png";
    let userName = "Baaset Moslih";
  
    function toggleSidebar() {
      sidebarOpen = !sidebarOpen;
    }
  
    let bookmarked_repo: RepoBookmark[] = [
      {repo_name: "fit3170-A1", repo_url: "https://github.com/user/fit3170-A1.git"},
      {repo_name: "this-is-a-repo", repo_url: "https://gitlab.com/abc0012/this-is-a-repo.git"},
      {repo_name: "project", repo_url: "https://github.com/example-org/project.git"},
      {repo_name: "another-project", repo_url: "https://gitlab.com/example-org/another-project.git"},
      {repo_name: "assignment", repo_url: "https://gitlab.com/xyz0001/assignment.git"},
      {repo_name: "assignment", repo_url: "https://gitlab.com/xyz0001/assignment.git2"},
      {repo_name: "assignment", repo_url: "https://gitlab.com/xyz0001/assignment.git3"},
      {repo_name: "assignment", repo_url: "https://gitlab.com/xyz0001/assignment.git4"},
    ];
  
    // 
    interface RepoOption {
      label: string,
      icon: string
    }
    let dropdownOpen = false;
    let selected: RepoOption | null = null;
  
    const options: RepoOption[] = [
      { label: "GitHub", icon: "brand-github" },
      { label: "GitLab", icon: "brand-gitlab" },
      { label: "Local", icon: "folder-code" }
    ];
  
    function selectOption(option: RepoOption) {
      selected = option;
      dropdownOpen = false;
    }
  
    function toggleDropdown() {
      dropdownOpen = !dropdownOpen;
    }
  
    function handleSubmit() {
      if (inputRepo.trim()) {
        goto(`/overview-page?repo=${encodeURIComponent(inputRepo)}`);
      }
    }
  
    function handleKeyPress(event: KeyboardEvent) {
      if (event.key === 'Enter') {
        handleSubmit();
      }
    }
  
  
  </script>
  
  <header>
    <div class="container">
      <div class="header-content">
        <div class="logo-section">
          <a href="/" class="cursor-pointer">
            <img class="logo-img" src="/secondary_logo.png" alt="Your Company">
          </a>
        </div>
  
        <div class="user-section">
          <h6 class="white body-accent">{userName}</h6>
          <img
            src="{profileImageURL}"
            alt="Profile"
            class="profile-img"
          />
  
          <button type='button' class="hamburger-btn" on:click={toggleSidebar}>
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
        <button type="button" class={`dropdown-btn ${dropdownOpen ? 'show' : 'hide'}`} on:click={toggleDropdown}>
          {#if selected}
            <div class="dropdown-show">
              <Icon
                icon={`tabler:${selected.icon}`}
                class="icon-medium"
                style="color: white"
              />
              <h6 class="display-body white dropdown-text" >{selected.label}</h6>
            </div>
          {:else}
            <h6 class="display-body white">Select an option</h6>
          {/if}
          <img src="/dropdown_icon.png" alt="dropdown icon">
        </button>
      
        {#if dropdownOpen}
          <div class="dropdown-content">
            {#each options as option}
              <button class="dropdown-option" on:click={() => selectOption(option)}>
                <Icon
                  icon={`tabler:${option.icon}`}
                  class="icon-medium"
                  style="color: white"
                />
                <h6 class="display-body white dropdown-text">{option.label}</h6>
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
          placeholder="enter a git repo..."
          bind:value={inputRepo}
          on:keypress={handleKeyPress}
        />
        <button class="repo-button" on:click={handleSubmit}>
          <Icon
              icon={"tabler:circle-arrow-right"}
              class="icon-medium"
              style="color: white"
            />
        </button>
      </div>
      
  
      <!-- Repo link list -->
      <div class="repo-bookmark-list">
        {#each bookmarked_repo as bookmark (bookmark.repo_url)}
          <button class="repo-list-btn" type="button">
            <h6 class="display-body repo-list-text white">{bookmark.repo_url}</h6>
          </button>
        {/each}
      </div>
    </div>
    
  </main>
  
  <!-- Sidebar -->
  <div class={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
    <div class="sidebar-header">
      <div class="sidebar-title">
        <Icon
          icon={"tabler:chart-line"}
          class="icon-large"
          style="color: white"
        />
        <h1 class="title sidebar-title-text white">settings</h1>
      </div>
      <button class="close-button" on:click={toggleSidebar}>
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
      
      {#each bookmarked_repo as repo (repo.repo_url)}
        <button class="bookmark-item">
          <h6 class="heading-2 repo-name label-secondary">{repo.repo_name}</h6>
          <h6 class="caption repo-url label-secondary">{repo.repo_url}</h6>
        </button>
      {/each}
    </div>
  </div>
  
  
  <style>
  /* MAIN PAGE CONTENT */
  .main {
    height: calc(100vh - 4.1875rem);
    display: flex;
    justify-content: center;
    align-items: center;
  }
  
  /* HEADER */
  .container {
    padding: 0px;
    margin-left: 2rem;
    margin-right: 2rem;
    margin-top: 2rem;
    margin-bottom: 0.8125rem;
  }
  
  .header-content {
    position: relative;
    display: flex;
    height: 1.375rem;
    align-items: center;
    justify-content: space-between;
  }
  
  .logo-section {
    display: flex;
  }
  
  .logo-img {
    height: 20px;
    width: auto;
  }
  
  .user-section {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 8px;
    padding-bottom: 8px;
  }
  
  .white {
    color: var(--white);
  }
  
  .label-secondary {
    color: var(--label-secondary);
  }
  
  .profile-img {
    height: 1.375rem;
    width: 1.375rem;
    margin-left: 0.8125rem;
    margin-right: 0.8125rem;
    object-fit: cover;
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
    background: var(--Background-Tint, rgba(34, 34, 34, 0.70));
    backdrop-filter: blur(16px);
    box-shadow: 0 10px 15px rgba(0, 0, 0, 0.3);
    z-index: 50;
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
    height: 1.8125rem
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
  
  .repo-name, .repo-url {
    margin-top: 0px;
    margin-bottom: 0px
  }
  
  
  /* REPO SECTION */
  .repo-start {
    /* width: ; */
    display: grid;
    grid-template-columns: 13rem 35.5rem; /* 2 columns */
    grid-template-rows: repeat(2, auto);  /* 2 rows */
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
    max-height: 10.875rem;         /* adjust height to fit your layout */
    overflow-y: auto;          /* enables vertical scrolling */
    overflow-x: hidden;
    /* padding-bottom: 84px;  */
    scroll-padding-bottom: 10.875rem;
  
    scrollbar-width: none; 
    -ms-overflow-style: none;
  
    -webkit-mask-image: linear-gradient(to bottom, black 0%, rgba(0,0,0,0.2) 80%, transparent 100%);
    mask-image: linear-gradient(to bottom, black 0%, rgba(0,0,0,0.2) 80%, transparent 100%);
    mask-size: 100% 100%;
    mask-repeat: no-repeat;
  }
  
  .repo-list-btn {
    height: 22px;
    width: inherit;
    background-color: #181818;
    border: none;
    margin: none;
    padding: 0px;
    text-align: left;
    cursor: pointer;
  }
  
  .repo-list-text {
    height: inherit;
    margin: 0px;
  }
  </style>
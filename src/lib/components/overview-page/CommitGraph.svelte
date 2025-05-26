<script lang="ts">
  import { onMount } from 'svelte';
  import { users } from '../../../data/dummyData';
  import CommitGraph from './Graph.svelte';
  import ContributorCards from './ContributorCards.svelte';
  import Icon from '@iconify/svelte';
  import { loadBranches } from '../../metrics';

  let repo = "jekyll";
  let owner = "jekyll";
  let branches: string[] = [];
  let selectedBranch = 'all';
  let sidebarOpen = false;
  let bookmarked_repo: { repo_name: string; repo_url: string }[] = [];

  function toggleSidebar() {
    sidebarOpen = !sidebarOpen;
  }

  onMount(async () => {
    const loadedBranches = await loadBranches(owner, repo);
    branches = loadedBranches;
    if (!branches.includes(selectedBranch)) {
      selectedBranch = 'all';
    }
  });
</script>

<main class="container">
  <div class="header-row">
    <h1 class="title">Overview Page</h1>
    <select 
      bind:value={selectedBranch} 
      class="branch-select"
    >
      {#each branches as branch}
        <option value={branch}>{branch === 'all' ? 'All Branches' : branch}</option>
      {/each}
    </select>
  </div>
  
  <CommitGraph {users} {selectedBranch} />
  <ContributorCards {users} {selectedBranch} />
</main>



<style>
  .container {
    margin: 0;
    padding: 1rem 2rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    min-height: auto;
  }

  .title {
    font-size: 2rem;
    font-weight: bold;
    margin-bottom: 2rem;
    color: #f6f6f6;
  }

  .header-row {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  }

  .branch-select {
    background-color: #333;
    color: #f6f6f6;
    border: 1px solid #444;
    border-radius: 6px;
    padding: 8px 12px;
    font-size: 14px;
    cursor: pointer;
    outline: none;
    transition: border-color 0.2s;
  }

  .branch-select:hover {
    border-color: #666;
  }

  .branch-select:focus {
    border-color: #888;
  }
</style>
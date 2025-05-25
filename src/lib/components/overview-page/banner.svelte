<script lang="ts">
    import { page } from '$app/stores';
    import Icon from '@iconify/svelte';

    export let repoPath: string;
  
    //bookmark toggle state
    let isBookmarked = false;

    function toggleBookmark() {
      isBookmarked = !isBookmarked;
    }


  </script>

  <div class="topbar">
    <!-- Logo / Home Link -->
    <a href="/landing-page" class="logo-section cursor-pointer">
      <img src="/submark.png" alt="logo" class="logo-img" color=""/>
    </a>
  
    <!-- repo pathway display -->
    <div class="repo-pathway">
        {repoPath}
    </div>
  
    <!-- bookmark toggle -->
    <button
      type="button"
      class="bookmark-btn"
      on:click={toggleBookmark}
      aria-pressed={isBookmarked}
    >
      <Icon
        icon={isBookmarked ? 'tabler:star-filled' : 'tabler:star'}
        class="icon-medium"
      />
    </button>
  </div>
  

  
  <style>
    /* topbar wrapper fixed at top-left */
    .topbar {
      /* position: fixed; */
      /* top: 1rem; */
      /* left: 1rem; */
      display: flex;
      align-items: center;
      gap: 0.75rem;
      z-index: 200;
      flex-direction: row;
    }
  
    .logo-img {
      height: 1.5rem;
      width: auto;
    }
  
    .repo-pathway {
      font-family: 'DM Mono', monospace;
      font-size: 1rem;
      color: var(--label-primary);
      white-space: nowrap;
    }
  
    .placeholder {
      font-style: italic;
      color: var(--label-tertiary);
    }
  
    .bookmark-btn {
      background: none;
      border: none;
      padding: 0.25rem;
      cursor: pointer;
      display: flex;
      color: var(--label-primary)
    }
  </style>
  
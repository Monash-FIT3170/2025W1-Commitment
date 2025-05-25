<script lang="ts">
    import Icon from '@iconify/svelte';
    import { bookmarks } from '$lib/stores/bookmarks';
    import type { Bookmark } from '$lib/stores/bookmarks';
    export let repoUrl: string;

    let bookmarked = bookmarks.contains(repoUrl);
    let repoPath = new URL(repoUrl).pathname.slice(1);

    function toggleBookmark() {
      bookmarked = !bookmarked;
      const bookmark: Bookmark = {
        "repoName": repoUrl.split('/').pop()?.replace('.git', '') || repoUrl,
        "repoUrl": repoUrl
      }
      bookmarks.toggle(bookmark);
    }

  </script>

  <div class="topbar">
    <!-- Logo / Home Link -->
    <a href="/" class="logo-section cursor-pointer">
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
      aria-pressed={bookmarked}
    >
      <Icon
        icon={bookmarked ? 'tabler:star-filled' : 'tabler:star'}
        class="icon-medium"
      />
    </button>
  </div>
  

  
  <style>
    /* topbar wrapper fixed at top-left */
    .topbar {
      position: fixed;
      top: 1rem;
      left: 1rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      z-index: 200;
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
  
    .bookmark-btn {
      background: none;
      border: none;
      padding: 0.25rem;
      cursor: pointer;
      display: flex;
      color: var(--label-primary)
    }
  </style>
  
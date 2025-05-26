<script lang="ts">
    import Icon from '@iconify/svelte';
    import { bookmarks } from '$lib/stores/bookmarks';
    import type { Repo } from '$lib/repo';
    import { getRepoType } from '$lib/repo';

    export let repoUrl: string;
    export let repoPath: string;

    let bookmarked = bookmarks.contains(repoUrl);

    function toggleBookmark() {
      bookmarked = !bookmarked;
      const bookmark: Repo = {
        "repoPath": repoUrl.split('/').pop()?.replace('.git', '') || repoUrl,
        "repoUrl": repoUrl,
        "repoType": getRepoType(repoUrl)
      }
      bookmarks.toggle(bookmark);
    }
</script>

<div class="topbar">
  <!-- Logo / Home Link -->
  <a href="/" class="logo-section">
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
    display: flex;
    align-items: center;
    height: inherit;
  }

  .logo-section {
    display: flex;
    align-items: center;
    margin-right: 0.8125rem;
  }

  .logo-img {
    height: 0.9375rem;
    /* margin-top: 2px; */

  }

  .repo-pathway {
    font-family: 'DM Mono', monospace;
    font-size: 1rem;
    color: var(--label-primary);
    white-space: nowrap;
    margin-right: 0.5rem;
  }

  .bookmark-btn {
    background: none;
    border: none;
    padding: 0px;
    cursor: pointer;
    display: flex;
    color: var(--label-primary)
  }
</style>

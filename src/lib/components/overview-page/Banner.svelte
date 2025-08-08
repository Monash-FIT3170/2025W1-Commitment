<script lang="ts">
		import Icon from '@iconify/svelte';
		import { bookmarks } from '$lib/stores/bookmarks';
		import type { Repo } from '$lib/repo';
		import { getRepoType } from '$lib/repo';

		let {
			repoUrl = null,
			repoPath = null
		} = $props();

		let bookmarked = $state(bookmarks.contains(repoUrl));

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
	{#if repoUrl && repoPath}
		<!-- Logo / Home Link -->
		<a href="/" class="logo-section">
			<img src="/submark.svg" alt="gitgauge logo" class="logo-img" color=""/>
		</a>

		<!-- repo display -->
		<div class="repo-pathway">{repoPath}</div>

		<!-- bookmark toggle -->
		<button
			type="button"
			class="bookmark-btn"
			onclick={toggleBookmark}
			aria-pressed={bookmarked}
		>
			<Icon
				icon={bookmarked ? 'tabler:star-filled' : 'tabler:star'}
				class="icon-medium"
			/>
		</button>
	<!-- else show secondary logo-->
	{:else}
		<div class="logo-section">
			<img src="/secondary_logo.svg" alt="gitgauge logo" class="logo-img" />
		</div>
	{/if}
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

<script lang="ts">
    import Icon from "@iconify/svelte";
    import { bookmarks } from "$lib/stores/bookmarks";
    import LeftMenu from "./LeftMenu.svelte";
    import type { Repo } from "$lib/repo";
    import { get_repo_type } from "$lib/repo";

    let {
        repo_url,
        repo_path,
    }: {
        repo_url: string;
        repo_path: string;
    } = $props();

    let bookmarked = $state(bookmarks.contains(repo_url));

    function toggle_bookmark() {
        bookmarked = !bookmarked;
        const bookmark: Repo = {
            repo_path:
                repo_url.split("/").pop()?.replace(".git", "") || repo_url,
            repo_url: repo_url,
            repo_type: get_repo_type(repo_url),
        };
        bookmarks.toggle(bookmark);
    }
</script>

<!--
@component
This is a banner component that displays the repository path and a bookmark
toggle button.

- Usage:
  ```svelte
	<LeftMenuWithRepo
		repo_url={repo_url}
		repo_path={repo_path}
	/>
  ```
- Props:
	- `repo_url`: The URL of the repository.
	- `repo_path`: The path of the repository.
-->

<LeftMenu>
    {#snippet content()}
        <!-- repo pathway display -->
        <div class="repo-pathway">
            {repo_path}
        </div>

        <!-- bookmark toggle -->
        <button
            type="button"
            class="bookmark-btn"
            onclick={toggle_bookmark}
            aria-pressed={bookmarked}
        >
            <Icon
                icon={bookmarked ? "tabler:star-filled" : "tabler:star"}
                class="icon-medium"
            />
        </button>
    {/snippet}
</LeftMenu>

<style>
    .repo-pathway {
        font-family: "DM Mono", monospace;
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
        color: var(--label-primary);
    }
</style>

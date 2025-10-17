<script lang="ts">
    import Icon from "@iconify/svelte";
    import LeftMenu from "./LeftMenu.svelte";
    import { manifest } from "$lib/stores/manifest";
    import { invoke } from "@tauri-apps/api/core";
    import { onMount } from "svelte";

    let {
        repo_url,
        owner,
        repo,
        on_refresh,
        refreshing = false,
        on_delete,
    }: {
        repo_url: string;
        owner: string;
        repo: string;
        on_refresh?: () => void;
        refreshing?: boolean;
        on_delete?: () => void;
    } = $props();

    let bookmarked = $state(
        $manifest.repository.some((r) => r.url === repo_url && r.bookmarked)
    );

    function toggle_bookmark() {
        bookmarked = !bookmarked;
        if (bookmarked) {
            manifest.bookmark(repo_url);
        } else {
            manifest.unbookmark(repo_url);
        }
        invoke("save_manifest", { manifest: $manifest });
    }

    // Update bookmarked state whenever manifest changes
    $effect(() => {
        bookmarked = $manifest.repository.some(
            (r) => r.url === repo_url && r.bookmarked
        );
    });
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
            {owner}/{repo}
        </div>

        <!-- refresh button -->
        {#if on_refresh}
            <button
                type="button"
                class="refresh-btn button-primary"
                onclick={on_refresh}
                disabled={refreshing}
                aria-label="Refresh repository"
            >
                <Icon
                    icon="tabler:refresh"
                    class="icon-medium"
                    style={refreshing ? "opacity: 0.5;" : ""}
                />
            </button>
        {/if}

        <!-- bookmark toggle -->
        <button
            type="button"
            class="bookmark-btn button-primary"
            onclick={toggle_bookmark}
            aria-pressed={bookmarked}
        >
            <Icon
                icon={bookmarked ? "tabler:star-filled" : "tabler:star"}
                class="icon-medium"
            />
        </button>

        <!-- delete button -->
        {#if on_delete}
            <button
                type="button"
                class="delete-btn button-primary"
                onclick={on_delete}
                aria-label="Delete repository"
            >
                <Icon icon="tabler:trash" class="icon-medium" />
            </button>
        {/if}
    {/snippet}
</LeftMenu>

<style>
    .repo-pathway {
        font-family: "DM Mono", monospace;
        font-size: 1rem;
        color: var(--label-primary);
        white-space: nowrap;
        margin-right: 0.5rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        min-width: 0;
    }

    .refresh-btn {
        background: none;
        border: none;
        padding: 0px;
        margin-right: 0.5rem;
        cursor: pointer;
        display: flex;
        color: var(--label-primary);
        transition: opacity 0.2s ease;
    }

    .refresh-btn:hover:not(:disabled) {
        opacity: 0.7;
    }

    .refresh-btn:disabled {
        cursor: not-allowed;
    }

    .bookmark-btn {
        background: none;
        border: none;
        padding: 0px;
        cursor: pointer;
        display: flex;
        color: var(--label-primary);
    }

    .delete-btn {
        background: none;
        border: none;
        padding: 0px;
        margin-left: 0.5rem;
        cursor: pointer;
        display: flex;
        color: var(--label-primary);
        transition: opacity 0.2s ease;
    }

    .delete-btn:hover {
        opacity: 0.7;
    }
</style>

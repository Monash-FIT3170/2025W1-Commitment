<script lang="ts">
    import Icon from "@iconify/svelte";
    import LeftMenu from "./LeftMenu.svelte";
    import Modal from "$lib/components/overview-page/Modal.svelte";
    import { manifest } from "$lib/stores/manifest";
    import { invoke } from "@tauri-apps/api/core";
    import { onMount } from "svelte";
    import ButtonTintedMedium from "$lib/components/global/ButtonTintedMedium.svelte";
    import ButtonPrimaryMedium from "$lib/components/global/ButtonPrimaryMedium.svelte";

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

    let show_delete_repo_modal = $state(false);
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
                class="refresh-btn btn-icon"
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
            class="bookmark-btn btn-icon"
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
                class="delete-btn btn-icon"
                onclick={() => (show_delete_repo_modal = true)}
                aria-label="Delete repository"
            >
                <Icon icon="tabler:trash" class="icon-medium" />
            </button>
        {/if}

        <!-- Delete Repo Warning Modal -->
        <Modal bind:show_modal={show_delete_repo_modal}>
            {#snippet icon()}
                <Icon icon="tabler:trash" class="icon-large" style="color: currentColor" />
            {/snippet}

            {#snippet header()}Delete Repository{/snippet}

            {#snippet body()}
                <p class="label-primary body">
                    Are you sure you want to delete the repository:  <b>{repo}</b>?
                </p>
                <div class="delete-modal-btns">
                    <ButtonTintedMedium
                        label="No. Go Back"
                        icon="x"
                        icon_first={true}
                        width="6rem"
                        onclick={() => (show_delete_repo_modal = false)}
                    />
                    <ButtonPrimaryMedium
                        label="Yes. Delete Repository"
                        icon="trash"
                        onclick={on_delete}
                    />
                </div>
            {/snippet}
        </Modal>
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

    .delete-modal-btns {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
        margin-top: 3rem;
        gap: 1rem;
    }
</style>

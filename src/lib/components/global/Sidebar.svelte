<script lang="ts">
    import { sidebar_open, close_sidebar } from "$lib/stores/sidebar";
    import Icon from "@iconify/svelte";
    import { manifest, type ManifestSchema } from "$lib/stores/manifest";
    import { onMount } from "svelte";
    import { invoke } from "@tauri-apps/api/core";
    import ButtonPrimaryMedium from "./ButtonPrimaryMedium.svelte";

    interface RepoBookmark {
        repo_name: string;
        repo_url: string;
        repo_bookmarked: boolean;
    }
    onMount(async () => {
        try {
            let data = await invoke<ManifestSchema>("read_manifest");
            manifest.set(data);
            console.log("page", data);
        } catch (e: any) {
            let err = typeof e === "string" ? e : (e?.message ?? String(e));
            console.error("read_manifest failed", e);
        }
    });
    let bookmarked_repos: RepoBookmark[] = $derived(
        $manifest["repository"].map((item) => {
            return {
                repo_name: item.name,
                repo_url: item.url,
                repo_bookmarked: item.bookmarked,
            };
        })
    );
</script>

<div class={`sidebar ${$sidebar_open ? "open" : "closed"}`}>
    <div class="sidebar-header">
        <div class="sidebar-title">
            <Icon
                icon="tabler:chart-line"
                class="icon-large"
                style="color: white"
            />
            <h1 class="title sidebar-title-text white">Settings</h1>
        </div>
        <button
            class="close-button"
            onclick={close_sidebar}
            aria-label="Close sidebar"
        >
            <Icon icon="tabler:x" class="icon-medium" style="color: white" />
        </button>
    </div>
    <div class="sidebar-item-container">
        <div class="header">
            <Icon
                icon="tabler:sparkles"
                class="icon-medium"
                style="color: white"
            />
            <h2 class="heading-1 sidebar-item-header white">AI integration</h2>    
        </div>
        <div class ="caption label-secondary">
            Add your Gemini API key to enable AI-powered features.
        </div>
        <ApiKeyField
            bind:api_input={api_input}
            on_submit={on_submit}
            error={api_error}
        />
    </div>
    <div class="sidebar-item-container">
        <div class="header">
            <Icon
                icon="tabler:star-filled"
                class="icon-medium"
                style="color: white"
            />
            <h2 class="heading-1 sidebar-item-header white">Bookmarks</h2>
        </div>

        {#each bookmarked_repos as repo (repo.repo_name)}
            {#if repo.repo_bookmarked}
                <button class="bookmark-item" type="button">
                    <h6 class="heading-2 repo-name label-secondary">
                        {repo.repo_name}
                    </h6>
                    <h6 class="caption repo-url label-secondary">
                        {repo.repo_url}
                    </h6>
                </button>
            {/if}
        {/each}
    </div>
</div>

<style>
    .sidebar {
        position: fixed;
        top: 0;
        right: 0;
        width: 18.4375rem;
        min-height: 93vh;
        padding: 2rem;
        border-radius: 8px 0 0 8px;
        border-top: solid var(--Label-Tertiary, #747474);
        border-bottom: solid var(--Label-Tertiary, #747474);
        border-left: solid var(--Label-Tertiary, #747474);
        border-width: 0.0625rem;
        background: var(--Background-Tint, rgba(34, 34, 34));
        backdrop-filter: blur(16px);
        box-shadow: 0 10px 15px rgba(0, 0, 0, 0.3);
        z-index: 210;
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
        margin-bottom: 1.5rem;
    }
    .sidebar-title {
        display: flex;
    }
    .sidebar-title-text {
        margin: auto 0 auto 0.375rem;
        height: 1.8125rem;
    }
    .close-button {
        cursor: pointer;
        background: none;
        border: none;
        padding: 0;
    }
    .sidebar-item-container {
        display: grid;
        grid-template-columns: 1fr;
        gap: 13px;
        padding: 0rem 0.375rem 1rem 0.375rem;
    }
    .header {
        display: flex;
        align-items: center;
        height: 22px;
    }
    .sidebar-item-header {
        padding: 0px 6px;
    }
    .bookmark-item {
        display: flex;
        flex-direction: column;
        text-align: left;
        cursor: pointer;
        background: none;
        border: none;
        padding: 0rem;
    }
    .repo-name,
    .repo-url {
        margin: 0;
    }
    .label-secondary {
        color: var(--label-secondary);
    }
    .white {
        color: var(--white);
    }
</style>

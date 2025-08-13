<script lang="ts">
    let {
        bookmarked_repos,
        onclick,
    }: {
        bookmarked_repos: { repo_name: string; repo_url: string }[];
        onclick: (repo_url: string) => void;
    } = $props();
</script>

<div class="repo-bookmark-list">
    {#each bookmarked_repos as bookmark (bookmark.repo_url)}
        <button
            class="repo-list-btn"
            type="button"
            onclick={() => onclick(bookmark.repo_url)}
        >
            <h6 class="display-body repo-list-text">
                {bookmark.repo_url}
            </h6>
        </button>
    {/each}
</div>

<style>
    .repo-bookmark-list {
        background: transparent;
        padding-left: 1.5rem;
        padding-right: 1.5rem;
        margin: 0px;
        /* width: 693px; */
        display: grid;
        grid-template-columns: 32.5rem;
        grid-template-rows: repeat(5);
        row-gap: 1rem;

        /* let the list overflow and can be scrolll */
        max-height: 10.875rem; /* adjust height to fit your layout */
        overflow-y: auto; /* enables vertical scrolling */
        overflow-x: hidden;
        scroll-padding-bottom: 10.875rem;

        scrollbar-width: none;
        -ms-overflow-style: none;

        -webkit-mask-image: linear-gradient(
            to bottom,
            black 0%,
            rgba(0, 0, 0, 0.2) 80%,
            transparent 100%
        );
        mask-image: linear-gradient(
            to bottom,
            black 0%,
            rgba(0, 0, 0, 0.2) 80%,
            transparent 100%
        );
        mask-size: 100% 100%;
        mask-repeat: no-repeat;
    }

    .repo-list-btn {
        height: 22px;
        width: inherit;
        background-color: transparent; /*#181818; */
        border: none;
        margin: none;
        padding: 0.5rem 0.5rem 0.5rem 0px;
        text-align: left;
        cursor: pointer;
        color: unset;
    }

    .repo-list-text {
        height: inherit;
        margin: 0px;
    }
</style>


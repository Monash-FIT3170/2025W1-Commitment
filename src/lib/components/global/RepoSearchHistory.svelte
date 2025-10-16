<script lang="ts">
    let {
        stored_repo_url_input,
        onclick,
    
    } = $props();

</script>

<div class="repo-search-history">
    {#each stored_repo_url_input as history (history.repo_url)}
        {#if history.repo_visited}
            <button
                class="repo-list-btn"
                type="button"
                onclick={() => onclick(history.repo_url)} 
            >
                <h6 class="display-body repo-list-text">
                    {history.repo_url}
                </h6>
            </button>
        {/if}
    {/each}
</div>


<style>
    .repo-search-history {
        background: transparent;
        padding-left: 0.5rem;
        padding-right: 0.5rem;
        margin: 0px;
        display: grid;
        grid-template-columns: 32.5rem;
        grid-template-rows: repeat(5);
        row-gap: 0.5rem;
        padding-bottom: 1rem;

        /* let the list overflow and can be scrolll */
        max-height: 5rem;
        overflow-y: auto; /* enables vertical scrolling */
        overflow-x: hidden;
        scroll-padding-bottom: 5rem;

        scrollbar-width: 10px;
        scrollbar-color: var(--tint-00) transparent;
        -ms-overflow-style: none;
    }
    .repo-list-btn {
        height: 1.375rem;
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
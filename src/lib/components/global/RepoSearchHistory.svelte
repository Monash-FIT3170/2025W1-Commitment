<script lang="ts">
    let {
        stored_repo_url_input,
        onclick,
    }: {
        stored_repo_url_input:{
            repo_name: string;
            repo_url: string;
            repo_visited: boolean;
        }[];
        onclick: (repo_url: string) => void;
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


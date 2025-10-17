<script lang="ts">
    let {
        bookmarked_repos,
        onclick,
    }: {
        bookmarked_repos: {
            repo_name: string;
            repo_url: string;
            repo_bookmarked: boolean;
        }[];
        onclick: (repo_url: string) => void;
    } = $props();
</script>

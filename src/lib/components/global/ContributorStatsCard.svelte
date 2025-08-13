<script lang="ts">
    import ContributorCard from "../global/ContributorCard.svelte";

    let {
        username,
        image,
        num_commits,
        total_lines_of_code,
        lines_per_commit,
        total_additions,
        total_deletions,
        scaling_factor,
    } = $props();
</script>

<!--
@component
This is a contributor card component that displays a user's profile and
contributor statistics.

- Usage:
  ```svelte
    <ContributorStatsCard {...contributor}/>
  ```
-->

<ContributorCard {username} {image} {scaling_factor}>
    {#snippet content()}
        <div class="contents body">
            <div>{num_commits} commits</div>
            <div>{total_lines_of_code} lines of code</div>
            <div>{lines_per_commit} lines/commit</div>
            <div class="body-accent addition">
                {total_additions}++ additions
            </div>
            <div class="body-accent deletion">
                {total_deletions}-- deletions
            </div>
        </div>
    {/snippet}
</ContributorCard>

<style>
    .contents {
        width: 100%;
        display: flex;
        flex-wrap: wrap;
        gap: 0.3125rem 0.625rem;
        width: 100%;
    }

    .contents > div {
        color: var(--label-secondary);
    }

    .addition {
        color: var(--wonderland--00d498) !important;
    }
    .deletion {
        color: var(--wonderland--ff748b) !important;
    }
</style>

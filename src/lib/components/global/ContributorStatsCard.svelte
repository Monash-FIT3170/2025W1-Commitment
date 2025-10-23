<script lang="ts">
    import ContributorCard from "$lib/components/global/ContributorCard.svelte";

    let {
        username,
        profile_colour,
        initials,
        num_commits,
        total_lines_of_code,
        lines_per_commit,
        total_additions,
        total_deletions,
        scaling_factor,
        querying_msgs,
        total_regex_matches,
        commits_matching_regex,
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

<ContributorCard {username} {profile_colour} {initials} {scaling_factor}>
    {#snippet content()}
        <div class="contents body">
            <div>{num_commits} commits</div>
            <div>{total_lines_of_code} lines of code</div>
            <div>{lines_per_commit} lines/commit</div>
            {#if querying_msgs}
                <div>{total_regex_matches} total matches found</div>
                <div>
                    {commits_matching_regex} commit(s) match the regex
                </div>
                <div>
                    {((commits_matching_regex / num_commits) * 100).toFixed(3)}%
                    of commits contain at least one match
                </div>
            {/if}
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

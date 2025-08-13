<script lang="ts">
    import {
        get_user_total_commits,
        get_user_total_lines_of_code,
        get_user_lines_per_commit,
        get_user_total_additions,
        get_user_total_deletions,
        calculate_scaling_factor,
        get_average_commits,
        get_sd,
        type Contributor,
    } from "../../metrics";

    import ContributorStatsCard from "../global/ContributorStatsCard.svelte";

    let {
        users,
        selected_branch: selected_branch,
    }: {
        users: Contributor[];
        selected_branch: string;
    } = $props();

    // Calculate metrics for each user
    let commit_mean = get_average_commits(users);
    let sd = get_sd(users);

    let people_with_metrics = $derived(
        users.map((user: Contributor) => {
            const num_commits = get_user_total_commits(user);
            const scaling_factor = calculate_scaling_factor(
                num_commits,
                commit_mean,
                sd,
            );
            return {
                username: user.bitmap_hash,
                image: user.bitmap,
                num_commits: num_commits,
                total_lines_of_code: get_user_total_lines_of_code(user),
                lines_per_commit: get_user_lines_per_commit(user),
                total_additions: get_user_total_additions(user),
                total_deletions: get_user_total_deletions(user),
                scaling_factor: scaling_factor.toFixed(1),
            };
        }),
    );

    // Sort users by scaling factor in descending order
    function people_with_metrics_sorted() {
        return people_with_metrics.sort((a, b) => {
            let scaling_a = Number(a.scaling_factor);
            let scaling_b = Number(b.scaling_factor);
            if (scaling_a === scaling_b) {
                return b.num_commits - a.num_commits;
            }
            return scaling_b - scaling_a;
        });
    }
</script>

<div class="cards-row">
    {#each people_with_metrics_sorted() as person}
        <ContributorStatsCard {...person} />
    {/each}
</div>

<style>
    .cards-row {
        width: 100%;
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        justify-content: center;
        margin-top: 3rem;
    }
</style>

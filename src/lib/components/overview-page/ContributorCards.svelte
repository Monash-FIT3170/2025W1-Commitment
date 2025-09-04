<script lang="ts">
    import {
        get_user_total_commits,
        get_user_total_lines_of_code,
        get_user_lines_per_commit,
        get_user_total_additions,
        get_user_total_deletions,
        get_user_absolute_diff,
        calculate_scaling_factor,
        get_average_commits,
        get_average_commit_size,
        get_average_absolute_diff,
        get_sd,
        type Contributor,
    } from "../../metrics";

    import ContributorStatsCard from "../global/ContributorStatsCard.svelte";

    let {
        users,
        metric,
    }: {
        users: Contributor[];
        metric: string;
    } = $props();

    // Calculate metrics based on selected metric - WITH EXPLICIT TYPES
    let metric_mean = $derived(() => {
        switch (metric) {
            case "commits":
                return get_average_commits(users);
            case "commit_size":
                return get_average_commit_size(users);
            case "absolute_diff":
                return get_average_absolute_diff(users);
            default:
                return get_average_commits(users);
        }
    });

    let sd_value: number = $derived(get_sd(users, metric));

    let people_with_metrics = $derived(
        users.map((user: Contributor) => {
            // Get the appropriate data value based on selected metric
            let data_value: number;
            switch (metric) {
                case "commits":
                    data_value = get_user_total_commits(user);
                    break;
                case "commit_size":
                    data_value = user.total_commits === 0 ? 0 : get_user_total_lines_of_code(user) / user.total_commits;
                    break;
                case "absolute_diff":
                    data_value = get_user_absolute_diff(user);
                    break;
                default:
                    data_value = get_user_total_commits(user);
            }

            const scaling_factor = calculate_scaling_factor(
                data_value,
                metric_mean(),  
                sd_value,     
            );
            
            return {
                username: user.bitmap_hash,
                image: user.bitmap,
                num_commits: get_user_total_commits(user),
                total_lines_of_code: get_user_total_lines_of_code(user),
                lines_per_commit: get_user_lines_per_commit(user),
                total_additions: get_user_total_additions(user),
                total_deletions: get_user_total_deletions(user),
                scaling_factor: scaling_factor.toFixed(1),
                metric_value: data_value,
                metric_name: metric,
            };
        }),
    );

    // Sort users by scaling factor in descending order
    function people_with_metrics_sorted() {
        return people_with_metrics.sort((a, b) => {
            let scaling_a = Number(a.scaling_factor);
            let scaling_b = Number(b.scaling_factor);
            if (scaling_a === scaling_b) {
                return b.metric_value - a.metric_value;
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

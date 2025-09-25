<script lang="ts">
    import {
        get_user_total_commits,
        get_user_total_lines_of_code,
        get_user_lines_per_commit,
        get_user_total_additions,
        get_user_total_deletions,
        get_user_absolute_diff,
        calculate_scaling_factor,
        calculate_quartile_scaling_factor,
        get_average_commits,
        get_average_commit_size,
        get_average_absolute_diff,
        get_commit_quartiles,
        get_commit_size_quartiles,
        get_absolute_diff_quartiles,
        get_sd,
        type Contributor,
    } from "$lib/metrics";

    import ContributorStatsCard from "$lib/components/global/ContributorStatsCard.svelte";

    let {
        users,
        selected_branch: selected_branch,
        start_date: start_date,
        end_date: end_date,
        metric,
        aggregation = "mean",
    }: {
        users: Contributor[];
        selected_branch: string;
        start_date: string;
        end_date: string;
        metric: string;
        aggregation?: string;
    } = $props();

    // Calculate metrics based on selected metric - WITH EXPLICIT TYPES
    let metric_centrality = $derived(() => {
        if (aggregation === "median") {
            switch (metric) {
                case "commits":
                    return get_commit_quartiles(users).median;
                case "commit_size":
                    return get_commit_size_quartiles(users).median;
                case "absolute_diff":
                    return get_absolute_diff_quartiles(users).median;
                default:
                    return get_commit_quartiles(users).median;
            }
        } else {
            // 'mean'
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
        }
    });

    let sd_value: number = $derived(get_sd(users, metric));

    let quartiles = $derived(() => {
        if (aggregation === "median") {
            switch (metric) {
                case "commits":
                    return get_commit_quartiles(users);
                case "commit_size":
                    return get_commit_size_quartiles(users);
                case "absolute_diff":
                    return get_absolute_diff_quartiles(users);
                default:
                    return get_commit_quartiles(users);
            }
        }
        return { q1: 0, median: 0, q3: 0 };
    });

    let people_with_metrics = $derived(
        users.map((user: Contributor) => {
            // Get the appropriate data value based on selected metric
            let data_value: number;
            switch (metric) {
                case "commits":
                    data_value = get_user_total_commits(user);
                    break;
                case "commit_size":
                    data_value =
                        user.total_commits === 0
                            ? 0
                            : get_user_total_lines_of_code(user) /
                              user.total_commits;
                    break;
                case "absolute_diff":
                    data_value = get_user_absolute_diff(user);
                    break;
                default:
                    data_value = get_user_total_commits(user);
            }

            let scaling_factor: number;
            if (aggregation === "mean") {
                scaling_factor = calculate_scaling_factor(
                    data_value,
                    metric_centrality(),
                    sd_value
                );
            } else {
                scaling_factor = calculate_quartile_scaling_factor(
                    data_value,
                    quartiles().q1,
                    quartiles().q3
                );
            }

            return {
                username: user.username,
                profile_colour: user.profile_colour,
                initials: user.username_initials,
                num_commits: get_user_total_commits(user),
                total_lines_of_code: get_user_total_lines_of_code(user),
                lines_per_commit: get_user_lines_per_commit(user),
                total_additions: get_user_total_additions(user),
                total_deletions: get_user_total_deletions(user),
                scaling_factor: scaling_factor.toFixed(1),
                metric_value: data_value,
                metric_name: metric,
            };
        })
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

    function get_display_name(user: Contributor): string {
        let name = "";
        if (user.username && user.username.trim() !== "") {
            name = user.username;
        } else if (
            user.contacts &&
            typeof user.contacts === "object" &&
            "Email" in user.contacts &&
            typeof (user.contacts as any).Email === "string"
        ) {
            name = (user.contacts as any).Email;
        } else if (typeof user.contacts === "string") {
            name = user.contacts;
        } else if (Array.isArray(user.contacts) && user.contacts.length > 0) {
            name = user.contacts[0];
        }
        // Extract username from GitHub noreply email if present
        const githubNoreplyMatch = name.match(
            /^\d+\+([a-zA-Z0-9-]+)@users\.noreply\.github\.com$/
        );

        if (githubNoreplyMatch) {
            name = githubNoreplyMatch[1];
        }

        // Normalize quotes and trim
        return name.replace(/["“”]/g, "").toLowerCase().trim();
    }
</script>

<div class="cards-container">
    {#each people_with_metrics_sorted() as person}
        <ContributorStatsCard {...person} />
    {/each}
</div>

<style>
    .cards-container {
        margin-top: 3rem;
        display: grid;
        grid-template-columns: repeat(auto-fill, 26rem);
        gap: 1rem;
        padding: 1rem;
        width: 100%;
        justify-items: center;
        justify-content: center;
    }
</style>

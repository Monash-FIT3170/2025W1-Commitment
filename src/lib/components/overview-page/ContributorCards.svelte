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
        start_date: start_date,
        end_date: end_date,
    }: {
        users: Contributor[];
        selected_branch: string;
        start_date: string;
        end_date: string;
    } = $props();

    // Calculate metrics for each user
    let commit_mean = get_average_commits(users);
    let sd = get_sd(users);
    // Sort users by name (case-insensitive)
    let sorted_users = $derived(
        [...users].sort((a, b) =>
            get_display_name(a).localeCompare(get_display_name(b))
        )
    );

    let people_with_metrics = $derived(
        sorted_users.map((user: Contributor) => {
            const num_commits = get_user_total_commits(user);
            const scaling_factor = calculate_scaling_factor(
                num_commits,
                commit_mean,
                sd
            );

            return {
                username: user.username,
                image: user.bitmap,
                num_commits: num_commits,
                total_lines_of_code: get_user_total_lines_of_code(user),
                lines_per_commit: get_user_lines_per_commit(user),
                total_additions: get_user_total_additions(user),
                total_deletions: get_user_total_deletions(user),
                scaling_factor: scaling_factor.toFixed(1),
            };
        })
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
        margin-top: 80px; /* Increased to prevent overlap with expanded graph x-axis */
    }
</style>

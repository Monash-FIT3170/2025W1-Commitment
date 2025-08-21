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

    let peopleWithMetrics = $derived(
        users.map((user: Contributor) => {
            const numCommits = get_user_total_commits(user);
            const scalingFactor = calculate_scaling_factor(
                numCommits,
                commit_mean,
                sd,
            );
            return {
                username: user.author.login,
                image: user.author.avatar_url,
                numCommits,
                totalLinesOfCode: get_user_total_lines_of_code(user),
                linesPerCommit: get_user_lines_per_commit(user),
                totalAdditions: get_user_total_additions(user),
                totalDeletions: get_user_total_deletions(user),
                scalingFactor: scalingFactor.toFixed(1),
            };
        }),
    );
</script>

<div class="cards-row">
    {#each peopleWithMetrics as person}
        <div class="profile-card">
            <div class="profile-header-row">
                <img
                    class="profile-avatar"
                    src={person.image}
                    alt={person.username}
                />
                <div class="profile-header-main">
                    <div class="profile-header-info">
                        <div class="profile-title">{person.username}</div>
                        <div class="profile-scaling">
                            scaling: {person.scalingFactor}
                        </div>
                    </div>
                    <div class="profile-metrics-main">
                        <div class="profile-metrics-row">
                            <span>{person.numCommits} commits</span>
                            <span class="metrics-separator">&nbsp;&nbsp;</span>
                            <span>{person.totalLinesOfCode} lines of code</span>
                        </div>
                        <div class="profile-metrics-row">
                            <span>{person.linesPerCommit} lines/commit</span>
                            <span class="metrics-separator">&nbsp;&nbsp;</span>
                            <span class="metrics-seperator">&nbsp;&nbsp;</span>
                        </div>
                        <div class="profile-metrics-row">
                            <span class="metrics-additions"
                                >{person.totalAdditions}++ additions</span
                            >
                            <span class="metrics-separator">&nbsp;&nbsp;</span>
                            <span class="metrics-deletions"
                                >{person.totalDeletions}-- deletions</span
                            >
                        </div>
                    </div>
                </div>
            </div>
        </div>
    {/each}
</div>

<style>
    .cards-row {
        width: 100%;
        display: flex;
        flex-wrap: wrap;
        gap: 2rem;
        justify-content: center;
        margin-top: 100px; /* Increased to prevent overlap with expanded graph x-axis */
    }

    .profile-card {
        display: flex;
        flex-direction: column;
        background: var(--Fill-Tint-00, rgba(31, 31, 31, 0.9));
        border-radius: 12px;
        padding: 20px 28px;
        min-width: 320px;
        min-height: 70px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }

    .profile-header-row {
        display: flex;
        flex-direction: row;
        align-items: flex-start;
        gap: 16px;
        margin-bottom: 0;
    }

    .profile-header-main {
        display: flex;
        flex-direction: column;
        flex: 1;
        width: 100%;
    }

    .profile-header-info {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        margin-bottom: 1px;
    }

    .profile-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        flex-shrink: 0;
        object-fit: cover;
        background: #ccc;
    }

    .profile-title {
        color: #fff;
        font-size: 18px;
        font-family:
            DM Sans,
            Inter,
            Arial,
            sans-serif;
        font-weight: 600;
        margin-bottom: 2px;
        text-align: left;
    }

    .profile-scaling {
        color: #a3a3a3;
        font-size: 14px;
        font-family:
            DM Sans,
            Inter,
            Arial,
            sans-serif;
        font-weight: 400;
        text-align: left;
        margin-bottom: 8px;
    }

    .profile-metrics-main {
        display: flex;
        flex-direction: column;
        width: 100%;
    }

    .profile-metrics-row {
        display: flex;
        flex-direction: row;
        align-items: center;
        font-size: 15px;
        color: #ccc;
        margin-bottom: 2px;
        font-family:
            DM Sans,
            Inter,
            Arial,
            sans-serif;
    }

    .metrics-separator {
        width: 16px;
        display: inline-block;
    }

    .metrics-additions {
        color: #4ade80;
        font-weight: bold;
    }

    .metrics-deletions {
        color: #fb7185;
        font-weight: bold;
    }
</style>


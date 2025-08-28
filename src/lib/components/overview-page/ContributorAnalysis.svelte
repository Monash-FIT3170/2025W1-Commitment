<script lang="ts">
    import ContributorCard from "../global/ContributorCard.svelte";
    import type { Contributor } from "$lib/metrics";
    import {
        calculate_scaling_factor,
        get_average_commits,
        get_sd,
        get_user_total_commits,
    } from "../../metrics";

    let {
        contributors,
    }: { contributors: Contributor[];} = $props();

    let commit_mean = get_average_commits(contributors);
    let sd = get_sd(contributors);

    let people_with_analysis = $derived(
        contributors.map((user: Contributor) => {
            const num_commits = get_user_total_commits(user);
            const scaling_factor = calculate_scaling_factor(
                num_commits,
                commit_mean,
                sd
            );
            return {
                username: user.bitmap_hash,
                image: user.bitmap,
                analysis: "",
                scaling_factor: scaling_factor.toFixed(1),
            };
        })
    );

    // Sort users by username alphabetically
    function contributors_sorted() {
        return people_with_analysis.sort((a, b) => {
            return a.username < b.username ? -1 : 1;
        });
    }
</script>

<main class="container">
    <div class="cards-row">
        {#each contributors_sorted() as person}
            <ContributorCard username={person.username} image={person.image} scaling_factor={person.scaling_factor}>
                <div class="contents body">
                    <div>{person.analysis}</div>
                </div>
            </ContributorCard>
        {/each}
    </div>
</main>

<style>
    .container {
        padding: 2rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        min-height: auto;
    }
</style>

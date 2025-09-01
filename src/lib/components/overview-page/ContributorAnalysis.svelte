<script lang="ts">
    import ContributorCard from "../global/ContributorCard.svelte";
    import type { Contributor } from "$lib/metrics";
    import {
        calculate_scaling_factor,
        get_average_commits,
        get_sd,
        get_user_total_commits,
    } from "../../metrics";
    import ButtonPrimaryMedium from "../global/ButtonPrimaryMedium.svelte";
    import { invoke } from "@tauri-apps/api/core";
    import { current_repo } from "$lib/stores/repo";
    import { summaries_store } from "$lib/stores/summaries";

    let { contributors }: { contributors: Contributor[] } = $props();

    let commit_mean = get_average_commits(contributors);
    let sd = get_sd(contributors);
    let loading = $state(false);

    async function generate_summaries() {
        loading = true;
        const repo_name = $current_repo.repo_path.split("/").pop();
        const repo_path = `../.gitgauge/repositories/${repo_name}`;
        if (repo_path) {
            try {
                const result: Record<string, string> = await invoke(
                    "get_ai_summary",
                    { path: repo_path }
                );
                summaries_store.update((store) => {
                    store.set(
                        $current_repo.repo_path,
                        new Map(Object.entries(result))
                    );
                    return store;
                });
            } catch (e) {
                console.error(e);
            } finally {
                loading = false;
            }
        }
    }

    let repo_summaries = $derived($summaries_store.get($current_repo.repo_path));
    let people_with_analysis = $derived(
        contributors.map((user: Contributor) => {
            const num_commits = get_user_total_commits(user);
            const scaling_factor = calculate_scaling_factor(
                num_commits,
                commit_mean,
                sd
            );
            let analysis = "";
            if (repo_summaries && "Email" in user.contacts) {
                analysis =
                    repo_summaries.get(user.contacts.Email as string) ||
                    "No summary available";
            } else if (!repo_summaries) {
                analysis = "Click 'Generate AI Summaries'";
            }

            return {
                username: user.bitmap_hash,
                image: user.bitmap,
                analysis: analysis,
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
    {#if loading}
        <div class="body">Loading...</div>
    {/if}
    {#if !loading}
        {#if repo_summaries}
            <div class="cards-container">
                {#each contributors_sorted() as person}
                    <ContributorCard
                        username={person.username}
                        image={person.image}
                        scaling_factor={person.scaling_factor}
                    >
                        {#snippet content()}
                            <div class="contents body">
                                <div>{person.analysis}</div>
                            </div>
                        {/snippet}
                    </ContributorCard>
                {/each}
            </div>
            <div class="button-container">
                <div>
                    <ButtonPrimaryMedium
                        label={"Regenerate AI Summaries"}
                        onclick={generate_summaries}
                        disabled={loading}
                    />
                </div>
            </div>
        {:else}
            <div class="button-container">
                <div>
                    <ButtonPrimaryMedium
                        label={"Generate AI Summaries"}
                        onclick={generate_summaries}
                        disabled={loading}
                    />
                </div>
            </div>
        {/if}
    {/if}
</main>

<style>
    .container {
        padding: 2rem 2rem 2rem 2rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        min-height: auto;
    }

    .contents {
        text-align: start;
    }

    .cards-container {
        margin-top: 1rem;
        display: grid;
        grid-template-columns: repeat(auto-fill, 26rem);
        gap: 1rem;
        padding: 1rem;
        width: 100%;
        justify-items: center;
        justify-content: center;
    }

    .button-container {
        display: flex;
        justify-content: center;
        height: calc(100vh - 26rem);
        align-items: center;
    }
</style>

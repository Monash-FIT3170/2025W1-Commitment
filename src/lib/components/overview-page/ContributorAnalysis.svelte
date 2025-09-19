<script lang="ts">
    import ContributorCard from "$lib/components/global/ContributorCard.svelte";
    import type { Contributor } from "$lib/metrics";
    import {
        calculate_scaling_factor,
        get_average_commits,
        get_sd,
        get_user_total_commits,
    } from "$lib/metrics";
    import { info, error } from "@tauri-apps/plugin-log";
    import ButtonPrimaryMedium from "$lib/components/global/ButtonPrimaryMedium.svelte";
    import { invoke } from "@tauri-apps/api/core";
    import { listen } from "@tauri-apps/api/event";
    import ProgressBar from "$lib/components/global/ProgressBar.svelte";
    import { SvelteMap } from "svelte/reactivity";
    import { get_source_type } from "$lib/github_url_verifier";

    let {
        contributors,
        repo_path,
        email_mapping,
        selected_criteria,
        source_type,
    }: {
        contributors: Contributor[];
        repo_path: string;
        email_mapping?: any;
        selected_criteria: string;
        source_type: number;
    } = $props();

    let commit_mean = get_average_commits(contributors);
    let sd = get_sd(contributors, selected_criteria);
    let loading = $state(false);
    let total_summaries = $state(0);
    let generated_summaries = $state(0);
    let progress = $derived(
        total_summaries > 0 ? (generated_summaries / total_summaries) * 100 : 0
    );
    let error_message = $state("");

    let summaries = new SvelteMap<string, string>();

    async function generate_summaries() {
        loading = true;
        generated_summaries = 0;
        total_summaries = 0;

        const unlisten_total = await listen("summary-total", (event) => {
            total_summaries = event.payload as number;
        });

        const unlisten_progress = await listen("summary-progress", (event) => {
            const { email, summary } = event.payload as {
                email: string;
                summary: string;
            };
            summaries.set(email, summary);
            generated_summaries++;
        });

        const key_set = await invoke("check_key_set");
        info("key_set:", key_set);
        if (!key_set) {
            error_message =
                "Please set a valid Gemini API key in Settings to generate summaries.";
            loading = false;
            unlisten_total();
            unlisten_progress();
            return;
        }

        const working_dir = await invoke("get_working_directory");
        const full_repo_path = `${working_dir}/repositories/${repo_path}`;

        if (repo_path) {
            try {
                if (email_mapping) {
                    await invoke("get_ai_summary_with_config", {
                        path: full_repo_path,
                        configJson: email_mapping,
                    });
                } else {
                    await invoke("get_ai_summary", { path: full_repo_path });
                }
            } catch (e) {
                error("Error occurred: " + e);
            } finally {
                loading = false;
                unlisten_total();
                unlisten_progress();
            }
        }
    }

    function get_email(user: Contributor): string | undefined {
        if (user.contacts) {
            if (typeof user.contacts === "string") {
                return user.contacts;
            } else if (
                Array.isArray(user.contacts) &&
                user.contacts.length > 0
            ) {
                return user.contacts[0];
            } else if (
                typeof user.contacts === "object" &&
                user.contacts !== null
            ) {
                if ("Email" in user.contacts) {
                    return (user.contacts as { Email: string }).Email;
                } else if (
                    "EmailList" in user.contacts &&
                    Array.isArray((user.contacts as any).EmailList) &&
                    (user.contacts as any).EmailList.length > 0
                ) {
                    return (user.contacts as any).EmailList[0];
                }
            }
        }

        return undefined;
    }

    let people_with_analysis = $derived(
        contributors.map((user: Contributor) => {
            const num_commits = get_user_total_commits(user);
            const scaling_factor = calculate_scaling_factor(
                num_commits,
                commit_mean,
                sd
            );

            const email = get_email(user);

            let analysis = "";

            if (summaries) {
                if (email) {
                    analysis = summaries.get(email) || "No summary available";
                } else {
                    analysis = "No email found for contributor.";
                }
            } else {
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
    {#if error_message}
        <div class="error-message">
            {error_message}
        </div>
    {/if}
    {#if loading}
        <div class="w-full max-w-2xl mx-auto">
            <ProgressBar
                {progress}
                label={`Generating summaries... (${generated_summaries}/${total_summaries})`}
            />
        </div>
    {/if}
    {#if !loading}
        {#if summaries && summaries.size > 0}
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
        min-height: calc(100vh - 27rem);
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
        height: calc(100vh - 31.1rem);
        align-items: center;
    }
    .error-message {
        color: #e53e3e;
        margin-bottom: 1rem;
        font-family: "DM Sans", sans-serif;
        font-size: 1rem;
    }
</style>

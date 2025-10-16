<script lang="ts">
    import ContributorCard from "$lib/components/global/ContributorCard.svelte";
    import type { Contributor } from "$lib/metrics";
    import {
        calculate_scaling_factor,
        calculate_quartile_scaling_factor,
        get_average_commits,
        get_commit_quartiles,
        get_sd,
        get_user_total_commits,
    } from "$lib/metrics";
    import { info, error } from "@tauri-apps/plugin-log";
    import { onDestroy } from "svelte";
    import ButtonPrimaryMedium from "$lib/components/global/ButtonPrimaryMedium.svelte";
    import ButtonTintedMedium from "$lib/components/global/ButtonTintedMedium.svelte";
    import { invoke } from "@tauri-apps/api/core";
    import { listen } from "@tauri-apps/api/event";
    import { SvelteMap } from "svelte/reactivity";
    import LoadingIndicator from "../global/LoadingIndicator.svelte";

    let {
        contributors,
        repo_path,
        email_mapping,
        selected_criteria,
        source_type,
        aggregation = "mean",
    }: {
        contributors: Contributor[];
        repo_path: string;
        email_mapping?: any;
        selected_criteria: string;
        source_type: number;
        aggregation?: string;
    } = $props();

    let commit_mean = $derived(get_average_commits(contributors));
    let sd = $derived(get_sd(contributors, selected_criteria));
    let quartiles = $derived(get_commit_quartiles(contributors));
    let loading = $state(false);
    let total_summaries = $state(0);
    let generated_summaries = $state(0);
    let progress = $derived(
        total_summaries > 0 ? (generated_summaries / total_summaries) * 100 : 0
    );

    let error_flag = $state(false);
    let error_message = $state("");
    let loadingImageIndex = $state(0);

    let summaries = new SvelteMap<string, string>();

    // Store summaries in localStorage for persistence
    let summaries_cache = $state<Map<string, Map<string, string>>>(new Map());

    // Loading animation interval
    let loadingIntervalId: number | undefined;

    $effect(() => {
        if (loading) {
            loadingIntervalId = window.setInterval(() => {
                loadingImageIndex = (loadingImageIndex + 1) % 4;
            }, 500);
        } else {
            if (loadingIntervalId) {
                clearInterval(loadingIntervalId);
                loadingIntervalId = undefined;
            }
        }
    });

    onDestroy(() => {
        if (loadingIntervalId) {
            clearInterval(loadingIntervalId);
        }
    });

    // Load existing summaries from localStorage when component initializes
    $effect(() => {
        if (typeof window !== "undefined") {
            const stored = localStorage.getItem("contributor_summaries");
            if (stored) {
                try {
                    const parsed = JSON.parse(stored);
                    summaries_cache = new Map(
                        Object.entries(parsed).map(
                            ([repo, summaryObj]: [string, any]) => [
                                repo,
                                new Map(Object.entries(summaryObj)),
                            ]
                        )
                    );
                } catch (e) {
                    console.error("Failed to parse stored summaries:", e);
                }
            }
        }
    });

    // Load summaries for current repo when repo_path changes
    $effect(() => {
        if (repo_path && summaries_cache.has(repo_path)) {
            const repo_summaries = summaries_cache.get(repo_path);
            if (repo_summaries) {
                summaries.clear();
                for (const [email, summary] of repo_summaries) {
                    summaries.set(email, summary);
                }
            }
        }
    });

    async function cancel_generation() {
        try {
            await invoke("cancel_summary_generation");
        } catch (e) {
            error("Error cancelling generation: " + e);
        }
    }

    async function generate_summaries() {
        loading = true;
        generated_summaries = 0;
        total_summaries = 0;
        error_flag = false;
        error_message = "";

        // Store the current summaries before regeneration in case of cancellation
        const previous_summaries = new Map<string, string>();
        for (const [email, summary] of summaries) {
            previous_summaries.set(email, summary);
        }

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
        if (!key_set) {
            error_flag = true;
            error_message =
                "Please set a valid Gemini API key in Settings to generate summaries.";
            loading = false;
            unlisten_total();
            unlisten_progress();
            return;
        }

        if (repo_path) {
            try {
                if (email_mapping) {
                    await invoke("get_ai_summary_with_config", {
                        path: repo_path,
                        configJson: email_mapping,
                    });
                } else {
                    await invoke("get_ai_summary", { path: repo_path });
                }
            } catch (e) {
                error("Error occurred: " + e);
                // Check if it was a cancellation
                if (e && typeof e === "string" && e.includes("cancelled")) {
                    // Restore previous summaries from backup
                    summaries.clear();
                    for (const [email, summary] of previous_summaries) {
                        summaries.set(email, summary);
                    }
                    // Don't show error flag for cancellation - just revert to previous state
                    error_flag = false;
                } else {
                    error_message =
                        "An error occurred while generating summaries.\n Error: " +
                        e;
                    error_flag = true;
                }
            } finally {
                loading = false;
                unlisten_total();
                unlisten_progress();

                // Save summaries to localStorage only if not cancelled
                if (repo_path && summaries.size > 0 && !error_flag) {
                    const repo_summaries = new Map<string, string>();
                    for (const [email, summary] of summaries) {
                        repo_summaries.set(email, summary);
                    }
                    summaries_cache.set(repo_path, repo_summaries);

                    // Persist to localStorage
                    if (typeof window !== "undefined") {
                        const cache_obj: Record<
                            string,
                            Record<string, string>
                        > = {};
                        for (const [repo, summaryMap] of summaries_cache) {
                            cache_obj[repo] = Object.fromEntries(summaryMap);
                        }
                        localStorage.setItem(
                            "contributor_summaries",
                            JSON.stringify(cache_obj)
                        );
                    }
                }
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
            let scaling_factor: number;

            if (aggregation === "mean") {
                scaling_factor = calculate_scaling_factor(
                    num_commits,
                    commit_mean,
                    sd
                );
            } else {
                scaling_factor = calculate_quartile_scaling_factor(
                    num_commits,
                    quartiles.q1,
                    quartiles.q3
                );
            }

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
                username: user.username,
                profile_colour: user.profile_colour,
                initials: user.username_initials,
                analysis: analysis,
                scaling_factor: scaling_factor.toFixed(1),
            };
        })
    );

    // Sort users by username alphabetically
    let contributors_sorted = $derived(
        people_with_analysis.sort((a, b) => {
            return a.username < b.username ? -1 : 1;
        })
    );
</script>

<main class="container">
    {#if error_flag}
        <div class="error-message">
            {error_message}
        </div>
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
    {#if loading}
        <div class="background-blur">
            <div class="loading-content">
                <div class="loading-indicator">
                    <img
                        src="/loading-indicators/loading-{loadingImageIndex +
                            1}.svg"
                        alt="loading..."
                        height="48"
                        width="48"
                        class="loading-image"
                    />
                    <div class="display-body">
                        Generating summaries... ({generated_summaries}/{total_summaries})
                    </div>
                </div>
                <div class="cancel-button-container">
                    <ButtonTintedMedium
                        label="Cancel"
                        icon="x"
                        onclick={cancel_generation}
                    />
                </div>
            </div>
        </div>
    {/if}
    {#if !loading && !error_flag}
        {#if summaries && summaries.size > 0}
            <div class="cards-container">
                {#each contributors_sorted as person}
                    <ContributorCard
                        username={person.username}
                        profile_colour={person.profile_colour}
                        initials={person.initials}
                        scaling_factor={Number(person.scaling_factor)}
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
                <ButtonPrimaryMedium
                    label={"Regenerate AI Summaries"}
                    onclick={generate_summaries}
                    disabled={loading}
                />
            </div>
        {:else}
            <div class="button-container">
                <ButtonPrimaryMedium
                    label={"Generate AI Summaries"}
                    onclick={generate_summaries}
                    disabled={loading}
                />
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
        display: grid;
        grid-template-columns: repeat(auto-fill, 26rem);
        gap: 1rem;
        padding: 2rem;
        width: 100%;
        justify-items: center;
        justify-content: center;
    }

    .button-container {
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .background-blur {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(5px);
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .loading-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2rem;
    }

    .loading-indicator {
        align-items: center;
        justify-content: center;
        display: flex;
        flex-direction: column;
    }

    .cancel-button-container {
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .error-message {
        color: #e53e3e;
        margin-bottom: 1rem;
        font-family: "DM Sans", sans-serif;
        font-size: 1rem;
    }
</style>

<script lang="ts">
    import { page } from "$app/state";
    import { create_dropdown_selection } from "$lib/stores/dropdown";
    import Icon from "@iconify/svelte";
    import ButtonTintedMedium from "$lib/components/global/ButtonTintedMedium.svelte";
    import AccessTokenModal from "../global/AccessTokenModal.svelte";
    import DropdownTintedMedium from "../global/DropdownTintedMedium.svelte";
    import Tab from "../global/Tab.svelte";

    let { repo_path: repo_path, repo_type: repo_type = "github" } = $props();

    let branches: string[] = $derived(page.state.branches || []);
    let branch_selection = $derived(
        create_dropdown_selection(branches[0] || "All")
    );

    let start_date = $state("01-01-25");
    let end_date = $state("20-01-25");
    let selected_view: string = $state("overview");

    const tabs = [
        { id: "overview", label: "Overview", icon: "chart-line" },
        { id: "analysis", label: "Contribution Analysis", icon: "id" },
    ];

    function select_view(id: string) {
        selected_view = id;
    }

    let show_modal = $state(true); // Show modal automatically on page load

    function handle_token_add(token: string) {
        console.log("Personal Access Token received:", token);
        // Process the token here
    }

    function open_calendar() {
        //calendar logic
        //task for future sprint
    }
</script>

<div class="page-header">
    <div class="top-container">
        <div class="repo-path-container">
            <span class="repo-path display-title" title={repo_path}
                >{repo_path}</span
            >
            <div class="repo-icon">
                <Icon
                    icon={`tabler:brand-${repo_type}`}
                    class="icon-xlarge"
                    style="color: white"
                />
            </div>
        </div>

        <!-- config btn -->
        <div class="config-btn heading-btn">
            <ButtonTintedMedium
                label="Config"
                icon="settings-2"
                label_class="body-accent"
                icon_first={true}
                width="4rem"
				on:click={() => (show_modal = true)}
            />
        </div>

            <!-- Access Token Modal -->
            <AccessTokenModal 
                bind:show_modal 
                on_token_add={handle_token_add}
            />

            <!-- branch dropdown btn -->
            <DropdownTintedMedium
                options={branches}
                selected={branch_selection.selected}
                disabled={false}
            />
        </div>

        <!-- calendar btn -->
        <div class="calendar-btn heading-btn">
            <ButtonTintedMedium
                label="{start_date}  →  {end_date}"
                icon="calendar-month"
                label_class="body"
                icon_first={false}
                width="12rem"
            />
        </div>

        <div class="heading-btn-spacer"></div>

        <span class="subtitle display-subtitle">Contribution Statistics</span>
    </div>

    <div class="page-select-btns">
        <!-- for each tab -->
        {#each tabs as tab}
            <Tab
                label={tab.label}
                icon={tab.icon}
                selected={selected_view === tab.id}
                width="100%"
            />
        {/each}
    </div>
</div>

<style>
    .page-header {
        display: flex;
        flex-direction: column;
        padding: 2rem 4rem;
    }

    .top-container {
        display: grid;
        grid-template-columns: 1fr auto auto auto;
        grid-template-areas:
            "repo-path config branch calendar"
            "subtitle subtitle subtitle heading-btn-spacer";
        align-items: center;
        column-gap: 1rem;
    }

    .repo-path-container {
        grid-area: repo-path;
        display: flex;
        align-items: center;
        gap: 1.5rem;
        min-width: 0;
    }

    .repo-path {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        min-width: 0;
    }

    .repo-icon {
        flex-shrink: 0;
        padding-right: 4rem;
    }

    .display-subtitle {
        color: var(--label-secondary);
        padding: 0.6rem 0;
    }

    .page-select-btns {
        display: grid;
        grid-template-columns: 20rem 20rem;
        column-gap: 1rem;
        padding-top: 2rem;
        z-index: 1;
    }

    .config-btn {
        grid-area: config;
    }

    .branch-dropdown {
        grid-area: branch;
    }

    .calendar-btn {
        grid-area: calendar;
    }

    .subtitle {
        grid-area: subtitle;
    }

    .heading-btn-spacer {
        grid-area: heading-btn-spacer;
        display: flex;
    }

    @media (max-width: 75rem) {
        .top-container {
            grid-template-columns: auto auto auto 1fr;
            grid-template-areas:
                "repo-path repo-path repo-path repo-path"
                "subtitle subtitle subtitle subtitle"
                "config branch calendar heading-btn-spacer";
        }

        .heading-btn {
            padding-top: 1rem;
        }

        .page-select-btns {
            grid-template-columns: 16rem 16rem;
            padding-top: 4rem;
        }
    }

</style>

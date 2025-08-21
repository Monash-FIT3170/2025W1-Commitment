<script lang="ts">
    import { page } from "$app/state";
    import Icon from "@iconify/svelte";
    import ButtonTintedMedium from "$lib/components/global/ButtonTintedMedium.svelte";
    import DropdownTintedMedium from "../global/DropdownTintedMedium.svelte";
    import Tab from "../global/Tab.svelte";
  import { get } from "svelte/store";
  import { load_commit_data, type Contributor } from "$lib/metrics";
  import Calendar from "../global/Calendar.svelte";

    let { repo: repo, repo_type: repo_type = "github", branches = [], branch_selection = $bindable(), start_date = $bindable(), end_date = $bindable() } = $props();

    let contributors: Contributor[] = [];

    let selected_view: string = $state("overview");

    const tabs = [
        { id: "overview", label: "Overview", icon: "chart-line" },
        { id: "analysis", label: "Contribution Analysis", icon: "id" },
    ];

    function select_view(id: string) {
        selected_view = id;
    }

    function open_config() {
        //config logic
    }

    function open_calendar() {
        //calendar logic
        //task for future sprint
    }
    function handleDateChange(event: CustomEvent<{ start: string; end: string }>) {
    start_date = event.detail.start;
    end_date = event.detail.end;
}
</script>

<div class="page-heading">
    <div class="top-container">
        <div class="display-title">
            {repo}
            <Icon
                icon={`tabler:brand-${repo_type}`}
                class="icon-xlarge"
                style="color: white"
            />
        </div>

        <div class="heading-btns">
            <!-- config btn -->
            <ButtonTintedMedium
                label="Config"
                icon="settings-2"
                label_class="body-accent"
                icon_first={true}
                width="4rem"
            />

            <!-- branch dropdown btn -->
            <DropdownTintedMedium
                options={branches}
                bind:selected={branch_selection}
                disabled={false}
            />

            <!-- calendar btn -->
            <Calendar
                initial_start={start_date}
                initial_end={end_date}
                date_format="d-m-Y"
                icon="calendar"
                icon_first={true}
                label_class="body-accent"
                label="Select Date Range"
                disabled={false}
                width="4rem"
                on:change={handleDateChange}
            />
        </div>
    </div>

    <span class="display-subtitle">Contribution Statistics</span>
    <div class="page-select-btns">
        <!-- for each tab -->
        {#each tabs as tab}
            <Tab
                label={tab.label}
                icon={tab.icon}
                selected={selected_view === tab.id}
                width="20rem"
            />
        {/each}
    </div>
</div>

<style>
    .page-heading {
        display: flex;
        flex-direction: column;
        padding: 2rem 4rem;
    }

    .top-container {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
        z-index: 110;
    }

    .display-title {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 1.5rem;
        z-index: 110;
    }

    .display-subtitle {
        color: var(--label-secondary);
        padding: 0.6rem 0;
        z-index: 110;
    }

    .heading-btns {
        display: flex;
        gap: 1rem;
        justify-content: flex-end;
        align-items: center;
        padding: 0;
        z-index: 110;
    }

    .page-select-btns {
        padding-top: 2rem;
        z-index: 110;
    }
</style>

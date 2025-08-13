<script lang="ts">
    import { page } from "$app/state";
    import { create_dropdown_selection } from "$lib/stores/dropdown";
    import Icon from "@iconify/svelte";
    import ButtonTintedMedium from "$lib/components/global/ButtonTintedMedium.svelte";
    import DropdownTintedMedium from "../global/DropdownTintedMedium.svelte";
    import Tab from "../global/Tab.svelte";

    let { repo_path: repo_path, repo_type: repo_type = "github" } = $props();

    let branches: string[] = $derived(page.state.branches || []);
    let branch_selection = $derived(
        create_dropdown_selection(branches[0] || "All"),
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

    function open_config() {
        //config logic
    }

    function open_calendar() {
        //calendar logic
        //task for future sprint
    }
</script>

<div class="page-heading">
    <div class="top-container">
        <div class="display-title">
            {repo_path}
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
                selected={branch_selection.selected}
                disabled={false}
            />

            <!-- calendar btn -->
            <ButtonTintedMedium
                label="{start_date}  →  {end_date}"
                icon="calendar-month"
                label_class="body"
                icon_first={false}
                width="16rem"
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

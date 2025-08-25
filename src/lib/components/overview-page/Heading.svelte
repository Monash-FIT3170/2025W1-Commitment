<script lang="ts">
    import { page } from "$app/state";
    import Icon from "@iconify/svelte";
    import ButtonTintedMedium from "$lib/components/global/ButtonTintedMedium.svelte";
    import DropdownTintedMedium from "../global/DropdownTintedMedium.svelte";
    import Tab from "../global/Tab.svelte";
    import Modal from "../global/Modal.svelte";
  import { get } from "svelte/store";
  import { load_commit_data, type Contributor } from "$lib/metrics";

    let { repo_path: repo_path, repo_type: repo_type = "github", branches = [], branch_selection = $bindable() } = $props();

    let contributors: Contributor[] = [];

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

    let showModal = $state(false);

    let files;
    let fileInput: HTMLInputElement;

    function triggerFileInput() {
        fileInput.click();
    }

    let textareaValue = "";
    function handleFileChange(event: Event) {
        const selectedFiles = (event.target as HTMLInputElement).files;
        if (selectedFiles && selectedFiles.length > 0) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target?.result as string;
                try {
                    const json = JSON.parse(text);
                    textareaValue = JSON.stringify(json, null, 4);
                } catch {
                    // If not valid JSON, just show the raw text
                    textareaValue = text;
                }
                console.log("File contents:", textareaValue);
            };
            reader.readAsText(selectedFiles[0]);
            showModal = false;
        }
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
				        on:click={() => (showModal = true)}
			      />

            <!-- Modal -->
            <Modal bind:showModal>
                <h2 id="modal-title" slot="header">
                    Upload config file
                </h2>
                <p>Upload a config file to group email addresses to contributors</p>
                    <input
                        type="file"
                        bind:this={fileInput}
                        style="display: none;"
                        on:change={handleFileChange}
                    />
                    <div style="display: flex; gap: 1rem; margin-top: 1rem;">
                        <ButtonTintedMedium
                            label="Cancel"
                            label_class="body"
                            icon_first={true}
                            width="4rem"
                            on:click={() => showModal = false}
                        />
                        <ButtonTintedMedium
                            label="Upload"
                            icon="upload"
                            label_class="body-accent"
                            icon_first={true}
                            width="4rem"
                            on:click={triggerFileInput}
                        />
                    </div>
            </Modal>

            <!-- branch dropdown btn -->
            <DropdownTintedMedium
                options={branches}
                bind:selected={branch_selection}
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

    .format-box {
	      width: 95%;
        padding: 1em;
        border-radius: 0.5em;
        border: 1px solid #555;
        background-color: #1e1e1e;
        color: #fff;
        font-size: 1em;
        margin-top: 1em;
        resize: vertical;
      }


</style>

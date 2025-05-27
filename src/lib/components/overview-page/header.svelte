<script lang="ts">
    import { onMount } from "svelte";

    let dropdownOpen = false;
    let options: { label: string }[] = [];
    let selected: { label: string };

    let startDate = "01-01-25";
    let endDate = "20-01-25";

    function toggleDropdown() {
        dropdownOpen = !dropdownOpen;
    }

    function selectOption(option: { label: string }) {
        selected = option;
        dropdownOpen = false;
    }

    function openConfig() {}

    function openDatePicker() {}

    onMount(() => {
        options = [{ label: "main" }, { label: "Repo B" }];
        selected = options[0];
    });
</script>

<div class="header-controls">
    <!-- Config Button -->
    <button class="config-btn" on:click={openConfig}>
        <span class="icon"></span>
        <span class="label">Config</span>
    </button>

    <!-- Dropdown -->
    <div class="dropdown-wrapper">
        <button
            type="button"
            class={`dropdown-btn ${dropdownOpen ? "show" : "hide"}`}
            on:click={toggleDropdown}
        >
            <span class="dropdown-text"
                >{selected?.label ?? "Select an option"}</span
            >
            <img src="/dropdown_icon.png" alt="dropdown arrow" />
        </button>

        {#if dropdownOpen}
            <div class="dropdown-content">
                {#each options as option}
                    <button
                        class="dropdown-option"
                        on:click={() => selectOption(option)}
                    >
                        <span class="dropdown-text">{option.label}</span>
                    </button>
                {/each}
            </div>
        {/if}
    </div>

    <!-- Date Range Button -->
    <button class="date-range-btn" on:click={openDatePicker}>
        {startDate} → {endDate}
        <span class="icon"></span>
    </button>
</div>

<style>
    .header-controls {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        justify-content: flex-end;
        padding-right: 1rem;
    }

    /* Config button */
    .config-btn {
        background-color: #222;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 6px;
        color: white;
        display: flex;
        align-items: center;
        gap: 0.4rem;
        cursor: pointer;
        font-size: 0.85rem;
    }

    .config-btn:hover {
        background-color: #333;
    }

    .icon {
        font-size: 0.9rem;
    }

    .label {
        font-weight: bold;
    }

    /* Dropdown */
    .dropdown-wrapper {
        position: relative;
        width: 161px;
    }

    .dropdown-btn {
        width: 100%;
        height: 42px;
        padding: 10px 12px 10px 16px;
        background: #222;
        border: none;
        border-radius: 12px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    .dropdown-content {
        position: absolute;
        top: 100%;
        left: 0;
        width: 100%;
        background-color: #222;
        border-bottom-left-radius: 12px;
        border-bottom-right-radius: 12px;
        z-index: 10;
    }

    .dropdown-option {
        width: 100%;
        height: 42px;
        padding: 10px 12px 10px 16px;
        background: #222;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: flex-start;
        color: white;
    }

    .dropdown-option:hover {
        background-color: #333;
    }

    .dropdown-text {
        color: white;
    }

    /* Date range button */
    .date-range-btn {
        background-color: #222;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 6px;
        color: white;
        display: flex;
        align-items: center;
        gap: 0.4rem;
        cursor: pointer;
        font-size: 0.85rem;
    }

    .date-range-btn:hover {
        background-color: #333;
    }
</style>

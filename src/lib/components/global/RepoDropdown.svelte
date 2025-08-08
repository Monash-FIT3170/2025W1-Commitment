<script lang="ts">
    import Icon from "@iconify/svelte";
    import {repo_options} from "../../stores/repo";
    import type { RepoOption } from "../../stores/repo";

    let {
        selected = $bindable<RepoOption>(),
        action = () => {},
    } = $props();

    let dropdownOpen = $state(false);

    function toggleDropdown() {
        dropdownOpen = !dropdownOpen;
    }

    function selectOption(option: RepoOption) {
        selected = option;
        dropdownOpen = false;
        action(option);
    }
</script>

{#snippet dropdownItem(repoOption: RepoOption)}
    <Icon
        icon={`tabler:${repoOption.icon}`}
        class="icon-medium"
        style="color: white"
    />
    <h6 class="display-body dropdown-text">
        {repoOption.label}
    </h6>
{/snippet}

<div class="dropdown">
    <button
        type="button"
        class={`dropdown-btn ${dropdownOpen ? "show" : "hide"}`}
        onclick={toggleDropdown}
    >
        {#if selected}
            <div class="dropdown-option">
                {@render dropdownItem(selected)}
            </div>
        {:else}
            <!-- This case should not happen with a default selected value -->
            <h6 class="display-body">Select an option</h6>
        {/if}
            <Icon
                icon={`tabler:chevron-down`}
                class="icon-medium"
                style="color: white"
            />
    </button>

    {#if dropdownOpen}
        <div class="dropdown-content">
            {#each repo_options as option}
                <button
                    class="dropdown-option"
                    onclick={() => selectOption(option)}
                >
                    {@render dropdownItem(option)}
                </button>
            {/each}
        </div>
    {/if}
</div>


<style>


    /* REPO DROPDOWN */
    .dropdown {
        position: relative;
        width: 13rem;
        height: 2.625em;
        border-radius: 12px;
        background: #222;
    }

    .dropdown-btn {
        width: 100%;
        height: inherit;
        padding: 0.625rem 0.75rem 0.5rem 0rem;
        background: #222;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: space-between;
        color: unset;
    }

    .dropdown-btn.hide {
        border-radius: 12px;
    }

    .dropdown-btn.show {
        border-top-left-radius: 12px;
        border-top-right-radius: 12px;
    }

    .dropdown-btn.show::after {
        content: "";
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        height: 1px;
        background-color: #fff;
    }

    .dropdown-show {
        display: flex;
        align-items: center;
    }

    .dropdown-item {
        display: flex;
        align-items: center;
        padding-right: 0.75rem;
        padding-left: 1rem;
        color: white;
    }

    .dropdown-content {
        width: inherit;
        background-color: #222;
        border-bottom-left-radius: 12px;
        border-bottom-right-radius: 12px;
    }

    .dropdown-option {
        width: inherit;
        height: 42px;
        padding: 0.625rem 0.75rem 0.625rem 1rem;
        background: none;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: start;
        color: unset;
    }

    .dropdown-text {
        margin-left: 0.5rem;
    }
</style>
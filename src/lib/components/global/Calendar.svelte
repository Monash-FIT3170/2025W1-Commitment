<script lang="ts">
    import { onMount, createEventDispatcher } from "svelte";
    import flatpickr from "flatpickr";
    import "flatpickr/dist/flatpickr.css";
    import Icon from "@iconify/svelte";
    import { Datepicker } from "flowbite-svelte";
    import { info } from "@tauri-apps/plugin-log";

    let {
        start = $bindable(),
        end = $bindable(),
        date_format = "d-m-Y",
        icon = "calendar-month",
        label_class = "body",
        disabled = false,
        width = "auto",
    }: {
        start: string;
        end: string;
        date_format: string;
        icon: string;
        label_class: string;
        disabled: boolean;
        width: string;
    } = $props();

    const dispatch = createEventDispatcher();

    let displayLabel = $derived(
        start && end ? `${start} → ${end}` : "Select dates"
    );

    let visible = $state(false);

    function open() {
        if (!disabled) {
            visible = true;
        }
    }

    let date_range: { start: Date | undefined; end: Date | undefined } = $state(
        {
            start: undefined,
            end: undefined,
        }
    );

    function reset_dates() {
        date_range.start = undefined;
        date_range.end = undefined;
        start = "";
        end = "";
        dispatch("change", { start, end });
        visible = false;
    }

    function handle_date_select() {
        if (date_range.start && date_range.end) {
            start = flatpickr.formatDate(date_range.start, date_format);
            end = flatpickr.formatDate(date_range.end, date_format);
            info("Selected range: " + start + end);
            dispatch("change", { start, end });
        }
    }

    function handle_click_outside(event: MouseEvent) {
        if (
            !event.target ||
            (!(event.target as HTMLElement).closest(".date-picker-container") &&
                !(event.target as HTMLElement).closest(".calendar-button"))
        ) {
            visible = false;
        }
    }

    onMount(() => {
        document.addEventListener("click", handle_click_outside);
    });
</script>

<div class="calendar-container body" style="position: relative;">
    <div class="buttons">
        <button
            class="calendar-button"
            onclick={open}
            {disabled}
            style="width: {width}"
        >
            <div class="label">
                <span class={label_class}>{displayLabel}</span>
            </div>
            {#if icon}
                <Icon icon={`tabler:${icon}`} class="icon-medium" />
            {/if}
        </button>
        {#if date_range.start && date_range.end}
            <button type="button" class="bookmark-btn" onclick={reset_dates}>
                <Icon icon={"tabler:filter-off"} class="icon-medium" />
            </button>
        {/if}
    </div>
    {#if visible}
        <div class="date-picker-container dark">
            <Datepicker
                color="gray"
                range
                inline
                bind:rangeFrom={date_range.start}
                bind:rangeTo={date_range.end}
                onselect={handle_date_select}
            />
        </div>
    {/if}
</div>

<style>
    .date-picker-container :global(button[aria-label="Previous month"]),
    .date-picker-container :global(button[aria-label="Next month"]),
    .date-picker-container :global(button[aria-label="Previous year"]),
    .date-picker-container :global(button[aria-label="Next year"]),
    .date-picker-container :global(button:not(.day)) {
        font-family: inherit;
        font-feature-settings: inherit;
        font-variation-settings: inherit;
        font-size: 100%;
        font-weight: inherit;
        line-height: inherit;
        letter-spacing: inherit;
        color: inherit;
        background-color: transparent;
        background-image: none;
        cursor: pointer;
        text-transform: none;
        appearance: button;
        border: none;
        padding: 0.5rem 0.6rem;
        min-width: 33px;
    }

    .date-picker-container :global(.grid-cols-4) {
        display: grid !important;
        grid-template-columns: repeat(4, minmax(64px, 1fr)) !important;
        gap: 0.25rem !important;
    }

    .date-picker-container :global(h3) {
        margin: 0 !important;
    }
    /* .date-picker-container :global(button:not(.day)) {
        padding-left: 0.6rem;
        padding-right: 0.6rem;
    } */

    /* .date-picker-container > flex > button:not(button[aria-label="Next year"]) {
        min-width: 30px;
        padding-top: 0rem;
        padding-bottom: 0rem;
    } */

    .date-picker-container :global(button:not(.day)):hover {
        background-color: var(--tint-01);
    }

    .calendar-container {
        align-items: center;
        gap: 0.5rem;
    }

    .date-picker-container {
        position: absolute;
        z-index: 1000;
        top: 100%;
        right: 0;
    }

    /* The main button that triggers the calendar */
    .calendar-button {
        all: unset;
        display: inline-flex;
        align-items: center;
        background-color: var(--tint-00);
        cursor: pointer;
        transition: background-color 0.2s ease;
        justify-content: space-between;
        gap: 4px;
        padding: 0.5rem 1.2rem;
        border-radius: 8px;
    }

    /* Hover background for button */
    .calendar-button:hover {
        background-color: var(--tint-01);
    }

    /* Active (pressed) background for button */
    .calendar-button:active {
        background-color: var(--tint-02);
    }

    /* Disabled button styles */
    .calendar-button:disabled {
        background-color: var(--tint-00);
        cursor: not-allowed;
        color: var(--label-secondary);
    }

    /* Label container inside button */
    .label {
        text-align: center;
        display: flex;
        justify-content: space-between;
    }

    .bookmark-btn {
        background: none;
        border: none;
        padding: 0.25rem;
        cursor: pointer;
        color: var(--label-primary);
    }

    .buttons {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
</style>

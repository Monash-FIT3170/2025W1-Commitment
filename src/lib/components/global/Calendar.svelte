<script lang="ts">
    import { onMount, createEventDispatcher } from "svelte";
    import flatpickr from "flatpickr";
    import "flatpickr/dist/flatpickr.css";
    import Icon from "@iconify/svelte";

    let {
        start = $bindable(),
        end = $bindable(),
        date_format = "d-m-Y",
        icon = "calendar-month",
        icon_first = false,
        label_class = "body",
        disabled = false,
        width = "auto",
        label = "Select Date Range",
    }: {
        start: string;
        end: string;
        date_format: string;
        icon: string;
        icon_first: boolean;
        label_class: string;
        disabled: boolean;
        width: string;
        label: string;
    } = $props();

    // let start = $state(initial_start);
    // let end = $state(initial_end);

    const dispatch = createEventDispatcher();
    let input_elem: HTMLInputElement;
    let picker: flatpickr.Instance;

    let displayLabel = $derived(
        start && end ? `${start} → ${end}` : "Select dates"
    );

    onMount(() => {
        picker = flatpickr(input_elem, {
            mode: "range",
            dateFormat: date_format,
            defaultDate: [start, end].filter(Boolean),
            onClose: (selected_dates) => {
                if (selected_dates.length === 2) {
                    const [s, e] = selected_dates.map((d) =>
                        flatpickr.formatDate(d, date_format)
                    );
                    start = s;
                    end = e;
                    dispatch("change", { start, end });
                }
            },
            onReady(_, __, instance) {
                instance.calendarContainer.classList.add("custom-flatpickr");
            },
        });
    });

    function open() {
        if (!disabled) picker.open();
    }
</script>

<input type="text" bind:this={input_elem} class="hidden-input" />

<button
    class="calendar-button"
    onclick={open}
    {disabled}
    style="width: {width}"
>
    {#if icon_first}
        {#if icon}
            <Icon icon={`tabler:${icon}`} class="icon-medium" />
        {/if}
        <div class="label"><span class={label_class}>{displayLabel}</span></div>
    {:else}
        <div class="label"><span class={label_class}>{displayLabel}</span></div>
        {#if icon}
            <Icon icon={`tabler:${icon}`} class="icon-medium" />
        {/if}
    {/if}
</button>

<style>
    /* Hidden input used by Flatpickr, not visible or interactive */
    .hidden-input {
        position: absolute;
        opacity: 0;
        pointer-events: none;
        width: 0;
        height: 0;
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

    /* Icon inside the button */
    .icon-medium {
        width: 1.1rem;
        height: 1.1rem;
        color: currentColor;
    }

    /* Flatpickr popup container */
    :global(.custom-flatpickr) {
        background: var(--tint-00);
         backdrop-filter: blur(32px); 
        -webkit-backdrop-filter: blur(32px);
        border-radius: 12px; 
        border: 0.25px solid white; 
        padding: 1rem; 
        color: var(--label-primary); 
        font-family: "DM Sans", sans-serif;
        z-index: 9999; 
    }

    /* Month header text in popup */
    :global(.custom-flatpickr .flatpickr-month) {
        font-weight: 600;
        font-size: 0.8rem;
        padding-top: 1rem;
        padding-bottom: 0.5rem;
        color: white;
        text-align: center;
    }

    /* Month navigation arrows */
    :global(.custom-flatpickr .flatpickr-prev-month),
    :global(.custom-flatpickr .flatpickr-next-month) {
        cursor: pointer;
        margin-top: 2rem;
        margin-left: 0.5rem;
        margin-right: 0.5rem;
        fill: var(--label-primary);
    }

    /* Weekday headers */
    :global(.custom-flatpickr .flatpickr-weekday) {
        color: var(--label-tertiary); /* Tertiary label color for weekdays */
        font-size: 0.75rem;
        text-transform: uppercase;
    }

    /* Individual day cells */
    :global(.custom-flatpickr .flatpickr-day) {
        border-radius: 6px;
        transition: background 0.2s ease;
        border: none; /* No default border on days */
    }

    /* Today's date styling */
    :global(.custom-flatpickr .flatpickr-day.today) {
        border: 1px solid var(--tint-03); /* Border to highlight today */
        font-weight: 500;
        border-radius: 100%;
    }

    /* Selected days and range days styling */
    :global(.custom-flatpickr .flatpickr-day.selected),
    :global(.custom-flatpickr .flatpickr-day.startRange),
    :global(.custom-flatpickr .flatpickr-day.endRange),
    :global(.custom-flatpickr .flatpickr-day.inRange) {
        background: var(--tint-02);
        outline-color: var(--tint-02) !important;
        color: white;
    }

    :global(.custom-flatpickr .flatpickr-day.inRange) {
        border-radius: 0 !important;
        box-shadow: var(--tint-02) -5px 0px 0px 0px
    }

    :global(.custom-flatpickr .flatpickr-day.endRange) {
        box-shadow: var(--tint-02) -5px 0px 0px 0px !important;
    }

    /* Day cells on hover: background change only, no border */
    :global(.custom-flatpickr .flatpickr-day:hover) {
        background: var(--tint-01);
        border: none !important; /* Remove any border on hover */
        border-radius: 100%;
        box-shadow: none !important;
    }

    /* Disabled day cells styling */
    :global(.custom-flatpickr .flatpickr-day.disabled),
    :global(.custom-flatpickr .flatpickr-day.notAllowed) {
        color: var(--label-disabled);
        opacity: 0.4;
        cursor: not-allowed;
    }
</style>

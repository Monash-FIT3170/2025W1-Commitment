<script>
    //destructure props with defaults including label class, width and icon order
    let {
        icon = null,
        label,
        labelClass = 'body',
        disabled = false,
        width = 'auto',      
        iconFirst = true    
    } = $props();
</script>

<!-- button element with support for dynamic icon position and width -->
<button class="medium" {disabled} style="width: {width}">
    {#if iconFirst}
        <!-- render icon first if iconFirst is true -->
        {#if icon}
            <Icon
                icon={`tabler:${icon}`}
                class="icon-medium"
                style="color: currentColor"
            />
        {/if}
        <!-- render label after icon -->
        <div class="label"><span class={labelClass}>{label}</span></div>
    {:else}
        <!-- render label before icon -->
        <div class="label"><span class={labelClass}>{label}</span></div>
        {#if icon}
            <Icon
                icon={`tabler:${icon}`}
                class="icon-medium"
                style="color: currentColor"
            />
        {/if}
    {/if}
</button>

<style>
/* label container with space-between layout */
.label {
    text-align: center;
    justify-content: space-between; 
    display: flex;
}

/* base button styles with flex layout and tint background */
button {
    all: unset;
    display: inline-flex;
    align-items: center;
    background-color: var(--tint-00);
    cursor: pointer;
    transition: background-color 0.2s ease;
    justify-content: space-between; 
}

/* medium size button spacing and rounded edges */
button.medium {
    gap: 4px;
    padding: 0.5rem 1.2rem;
    border-radius: 8px;
}

/* background color on hover */
button:hover {
    background-color: var(--tint-01);
}

/* background color when active/clicked */
button:active {
    background-color: var(--tint-02);
}

/* disabled button style with muted color and no interaction */
button:disabled {
    background-color: var(--tint-00);
    cursor: not-allowed;
    color: var(--label-secondary);
}
</style>

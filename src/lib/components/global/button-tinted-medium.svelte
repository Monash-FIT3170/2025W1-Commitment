<script>
    import Icon from "@iconify/svelte";
    
    let {
        icon = null,
        label,
        disabled = false,
        width = 'auto',      
        iconFirst = true    
    } = $props();

</script>

<button class="medium" {disabled} style="width: {width}">
    {#if iconFirst}
        {#if icon}
            <Icon
                icon={`tabler:${icon}`}
                class="icon-medium"
                style="color: currentColor"
            />
        {/if}
        <div class="label"><span class="body-accent">{label}</span></div>
    {:else}
        <div class="label"><span class="body-accent">{label}</span></div>
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
.label {
    text-align: center;
    justify-content: center;
    display: flex;
}

button {
    all: unset;
    display: inline-flex;
    align-items: center;
    background-color: var(--tint-00);
    cursor: pointer;
    transition: background-color 0.2s ease;
}

button.medium {
    gap: 4px;
    padding: 0.5rem 1.2rem;
    border-radius: 8px;
}

button:hover {
    background-color: var(--tint-01);
}

button:active {
    background-color: var(--tint-02);
}

button:disabled {
    background-color: var(--tint-00);
    cursor: not-allowed;
    color: var(--label-secondary);
}
</style>

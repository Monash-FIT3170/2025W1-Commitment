<script>
    import Icon from "@iconify/svelte";
    let { icon = null, label, disabled = false } = $props();
</script>

<button class="medium" {disabled}>
    {#if icon}
        <Icon
            icon={`tabler:${icon}`}
            class="icon-medium"
            style="color: currentColor"
        />
    {/if}
        <div class="label"><span class="body-accent">{label}</span></div>
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
    background-color: var(--fill-01);
    cursor: pointer;
    transition: background-color 0.2s ease;
    color: var(--background-primary);
}

button.medium {
    gap: 4px;
    padding: 6px 11px;
    border-radius: 8px;
}

button:hover {
    background-color: var(--fill-02);
}

button:active {
    background-color: var(--fill-00);
}

button:disabled {
    background-color: var(--fill-04);
    cursor: not-allowed;
}
</style>

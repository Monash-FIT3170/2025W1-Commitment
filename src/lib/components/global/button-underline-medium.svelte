<script lang="ts">
  import Icon from "@iconify/svelte";

  export let icon: string | null = null;
  export let label: string;
  export let disabled: boolean = false;
  export let width: string = 'auto';
  export let iconFirst: boolean = true;
  export let selected: boolean = false;

  
</script>

<button
  class="bottom-border-btn"
  class:active-style={selected}
  {disabled}
  style="
    width: {width};
    border-bottom: {selected 
      ? '2px solid var(--label-primary)' 
      : '1px solid var(--label-secondary)'};
    color: {selected 
      ? 'var(--label-primary)' 
      : 'var(--label-secondary)'};
  "
>
  {#if iconFirst}
    {#if icon}
      <Icon
        icon={`tabler:${icon}`}
        class="icon-medium"
        style="color: {selected 
          ? 'var(--label-primary)' 
          : 'var(--label-secondary)'}"
      />
    {/if}
    <div class="label">
      <span class={selected ? 'body-accent' : 'body'}>{label}</span>
    </div>
  {:else}
    <div class="label">
      <span class={selected ? 'body-accent' : 'body'}>{label}</span>
    </div>
    {#if icon}
      <Icon
        icon={`tabler:${icon}`}
        class="icon-medium"
        style="color: {selected 
          ? 'var(--label-primary)' 
          : 'var(--label-secondary)'}"
      />
    {/if}
  {/if}
</button>

<style>
  .bottom-border-btn {
    all: unset;
    display: inline-flex;
    align-items: center;
    justify-content: flex-start;
    background: none;
    transition: all 0.2s ease;
    padding: 0.5rem;
    cursor: pointer;
    gap: 0.5rem;
    width: 1
    00%;
  }
  .label {
    display: flex;
    align-items: center;
    text-align: left;
  }

  .bottom-border-btn.active-style {
    font-weight: 500;
  }
  
  .bottom-border-btn:disabled {
    cursor: not-allowed;
  }
</style>
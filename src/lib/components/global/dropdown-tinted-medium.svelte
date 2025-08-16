<script lang="ts">
    import { get } from "svelte/store";
    import type { Writable } from "svelte/store";
    import Icon from "@iconify/svelte";
  
    export let options: any[] = [];
    export let selected: Writable<any> | null = null;
    export let disabled: boolean = false;
    export let getLabel: (option: any) => string = (opt) =>
      typeof opt === "string" ? opt : opt.label ?? String(opt);
  
    let open = false;
  
    function toggleDropdown() {
      if (!disabled) open = !open;
    }
  
    function selectOption(option: any) {
      if (selected) selected.set(option);
      open = false;
    }
  
    function handleClickOutside(event: MouseEvent) {
      if (!event.target || !(event.target as HTMLElement).closest(".dropdown-wrapper")) {
        open = false;
      }
    }
  
    import { onMount, onDestroy } from "svelte";
    onMount(() => {
      document.addEventListener("click", handleClickOutside);
    });
    onDestroy(() => {
      document.removeEventListener("click", handleClickOutside);
    });
  </script>
  
  <div class="dropdown-wrapper">
    <button
      type="button"
      class="dropdown-toggle"
      aria-haspopup="listbox"
      aria-expanded={open}
      on:click={toggleDropdown}
      disabled={disabled}
    >
      <span class="selected-label body">{selected ? getLabel($selected) : "Select an option"}</span>
      <Icon
        icon={open ? "tabler:chevron-up" : "tabler:chevron-down"}
        class="icon-medium"
        style="color: currentColor"
      />
    </button>
  
    {#if open}
      <ul class="dropdown-list" role="listbox" tabindex="-1">
        {#each options as option (getLabel(option))}
          <li
            role="option"
            aria-selected={selected && option === $selected}
            class="dropdown-item body {selected && option === $selected ? 'selected' : ''}"
            on:click={() => selectOption(option)}
            on:keydown={(e) => e.key === "Enter" && selectOption(option)}
            tabindex="0"
          >
            {getLabel(option)}
          </li>
        {/each}
      </ul>
    {/if}
  </div>
  
  <style>
    .dropdown-wrapper { position: relative; }
  
    .dropdown-toggle {
      all: unset;
      display: inline-flex;
      justify-content: space-between; 
      align-items: center;
      min-width: 15rem;           
      background-color: var(--tint-00);
      cursor: pointer;
      transition: background-color 0.2s ease;
      gap: 4px;
      padding: 0.5rem 1.2rem;
      border-radius: 8px;       
    }
    .dropdown-toggle:hover {
      background-color: var(--tint-01);
    }
    .dropdown-toggle:active {
      background-color: var(--tint-02);
    }
    .dropdown-toggle:disabled {
      background-color: var(--tint-00);
      cursor: not-allowed;
      color: var(--label-secondary);
    }
  
    .dropdown-toggle[aria-expanded="true"] {
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
    border-bottom: 1px solid white;
}
  
    .selected-label { flex-grow: 1; text-align: left; }
  
    .dropdown-list {
      position: absolute;
      top: 100%;
      left: 0;
      width: 100%;
      margin: 0;
      padding: 0.5rem 0;
      list-style: none;          
      background: var(--background-primary);
      border-radius: 0 0 8px 8px;  
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
      z-index: 100;
      box-sizing: border-box;
    }
  
    /* Options */
    .dropdown-item {
      padding: 0.5rem 1rem;
      cursor: pointer;
    }
    .dropdown-item:hover,
    .dropdown-item:focus {
      background-color: var(--tint-01);
      outline: none;
    }
    .dropdown-item.selected {
      background-color: var(--tint-02);
      font-weight: 600;
    }
  </style>
  
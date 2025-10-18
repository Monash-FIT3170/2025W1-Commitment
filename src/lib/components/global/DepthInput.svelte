<script lang="ts">
    let {
        value = $bindable<string>(""),
        placeholder = "0",
        error = false,
    } = $props();
</script>

<!--
@component
This is a depth input component that matches the styling of the RepoSearchbar.
It's designed to be placed next to the search bar for entering depth values.

- Usage:
  ```svelte
    <DepthInput
        bind:value={input_value}
        placeholder="50"
        error={error}
    />
  ```
- Props:
    - `value`: A bindable string that holds the input value.
    - `placeholder`: A string that shows placeholder text (default: "0").
    - `error`: A boolean indicating whether there is an error with the input.
              If true, the input will be styled to indicate an error.
-->

<div class={["depth-input", { error }]}>
    <input
        class="depth-textbox display-body"
        type="text"
        {placeholder}
        bind:value
    />
</div>

<style>
    .depth-input {
        height: 1.25rem;
        width: 6rem;
        display: flex;
        justify-content: center;
        align-items: center;
        background-color: var(--tint-00);
        padding: 0.5625rem 0.75rem;
        border-radius: 12px;
        border-style: ridge;
        border-width: 0.125rem;
        border-color: transparent;
    }

    .depth-input.error {
        border-color: var(--wonderland--ff748b);
        border-style: ridge;
        border-width: 0.125rem;
    }

    .depth-textbox {
        flex: 1;
        background-color: inherit;
        border: none;
        height: 24px;
        padding: 0px;
        color: white;
        text-align: center;
        width: 100%;
    }

    .depth-textbox::placeholder {
        font-size: 1.063rem;
        font-family: DM Sans;
        font-weight: 400;
        word-wrap: break-word;
        text-align: center;
    }

    .depth-textbox:focus {
        outline: none;
    }
</style>

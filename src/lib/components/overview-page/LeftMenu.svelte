<script lang="ts">
    let {
        content,
    }: {
        content?: any;
    } = $props();
</script>

<!--
@component
This is the left menu component that contains the logo and optional content.
- Usage:
  ```svelte
	<LeftMenu>
		{#snippet content()}
			<!-- Optional content can be passed here --\>
		{/snippet}
	</LeftMenu>
  ```
- Props:
	- `content`: Optional content to be rendered in the topbar.
-->

<div class="topbar">
    {#if content}
        <!-- Logo / Home Link -->
        <a href="/" class="logo-section">
            <img
                src="/submark.svg"
                alt="gitgauge logo"
                class="logo-img"
                color=""
            />
        </a>
        {@render content()}
    {:else}
        <!-- Secondary Logo / Home Link -->
        <a href="/" class="logo-section">
            <img
                src="/secondary_logo.svg"
                alt="gitgauge logo"
                class="logo-img"
                color=""
            />
        </a>
    {/if}
</div>

<style>
    /* topbar wrapper fixed at top-left */
    .topbar {
        display: flex;
        align-items: center;
        height: inherit;
    }

    .logo-section {
        display: flex;
        align-items: center;
        margin-right: 0.8125rem;
    }

    .logo-img {
        height: 0.9375rem;
    }
</style>

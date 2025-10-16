<script lang="ts">
    import { manifest } from "$lib/stores/manifest";
    import type { Config } from "$lib/stores/manifest";

    let { repo_url }: { repo_url: string } = $props();

    // Get the email mapping for the current repository
    let email_mapping = $derived(() => {
        const repo = $manifest.repository.find((r) => r.url === repo_url);
        return repo?.email_mapping || {};
    });
</script>

<div class="mapping-container">
    {#if Object.keys(email_mapping()).length === 0}
        <p class="body label-secondary">
            No email mappings configured for this repository.
        </p>
    {:else}
        <div class="mapping-list">
            {#each Object.entries(email_mapping()) as [groupName, emails]}
                <div class="mapping-group">
                    <div class="group-header">
                        <p class="body-accent label-primary">{groupName}</p>
                    </div>
                    <div class="email-list">
                        {#each emails as email}
                            <div class="email-item-container">
                                <span class="email-item body label-secondary"
                                    >{email}</span
                                >
                            </div>
                        {/each}
                    </div>
                </div>
            {/each}
        </div>
    {/if}
</div>

<style>
    .mapping-container {
        padding: 0rem 0.5rem;
        background-color: var(--background-tertiary);
        border-radius: 8px;
        margin-top: 0.5rem;
        max-height: 400px;
        overflow-y: auto;
        overflow-x: hidden;
    }

    .mapping-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .mapping-group {
        background-color: var(--background-tertiary);
        border-radius: 6px;
        padding: 0.5rem;
        display: grid;
        grid-template-columns: 200px 1fr;
        gap: 1rem;
        align-items: start;
    }

    .email-item {
        text-overflow: ellipsis;
    }
    .group-header {
        margin-bottom: 0;
    }

    .email-list {
        /* display: flex; */
        flex-direction: column;
        gap: 0.25rem;
        margin-left: 0;
    }

    .label-primary {
        color: var(--label-primary);
    }

    .label-secondary {
        color: var(--label-secondary);
    }
</style>

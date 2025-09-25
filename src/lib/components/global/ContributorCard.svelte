<script lang="ts">
    let {
        username,
        profile_colour,
        initials,
        scaling_factor,
        content,
    }: {
        username: string;
        profile_colour: string;
        initials: string;
        scaling_factor: number;
        content: () => any;
    } = $props();
</script>

<!--
@component
This is a contributor card component that displays a user's profile information.

- Usage:
  ```svelte
    <ContributorCard contributor={Contributor}
        
    </ContributorCard>
  ```
- Props:
    - `contributor`: An object containing the contributor's information.
    - `contents`:   Additional content to display in the card. May also be a
                    Svelte component.
-->

<div class="profile-card">
    <!-- <img class="profile-avatar" src={image} alt={username} /> -->
    <div class="profile-avatar" style:background={profile_colour}>
        <div class="profile-initials">
            {initials}
        </div>
    </div>
    <div class="contents">
        <!-- header -->
        <div class="profile-details">
            <div class="body-accent">{username}</div>
            {#if scaling_factor !== undefined}
                <div class="body" style="color: var(--label-secondary)">
                    scaling: {scaling_factor}
                </div>
            {/if}
        </div>

        {@render content()}
    </div>
</div>

<style>
    .profile-card {
        display: flex;
        flex-direction: row;
        background: var(--Fill-Tint-00, rgba(31, 31, 31, 0.9));
        border-radius: 0.5rem;
        padding: 1.5rem;
        width: 23rem;
        box-shadow: 0 0.125rem 9.5rem rgba(0, 0, 0, 0.08);
        gap: 1rem;
    }

    .profile-avatar {
        display: flex;
        flex-shrink: 0;
        object-fit: cover;
        background: #ccc;
        height: 2rem;
        width: 2rem;
        border-radius: 50%;
        color: white;
        margin: auto;
        font-family:
            DM Sans,
            sans-serif;
        font-size: 1rem;
        font-weight: bold;
    }

    .profile-initials {
        margin: auto;
    }

    .contents {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        flex: 1;
        width: 100%;
        gap: 0.625rem;
    }

    .profile-details {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
    }
</style>

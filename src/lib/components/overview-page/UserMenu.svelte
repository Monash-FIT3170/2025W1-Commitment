<script lang="ts">
  import Icon from '@iconify/svelte';
  import { sidebarOpen, openSidebar } from '$lib/stores/sidebar';

  export let userName: string;
  export let profileImageURL: string;

</script>
  
  <!-- user menu: user name, avatar, and sidebar toggle button -->
<div class="user-menu">
  <h6 class="body-accent user-name">{userName}</h6>
  <img src="{profileImageURL}" alt="Profile" class="profile-img" />

  <button class="hamburger-btn" on:click={openSidebar} aria-expanded={$sidebarOpen}>
    <Icon icon="tabler:menu-2" class="icon-medium" />
  </button>
</div>
  
  
<style>
.user-menu {
  display: flex;
  align-items: center;
  height: inherit;
}

.user-name {
  margin-top: 0px;
  margin-bottom: 0px;
  margin-right: 0.5rem;
}

.profile-img {
  width: 1.375rem;
  height: 1.375rem;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 0.8125rem;
}

.hamburger-btn {
  background: none;
  border: none;
  padding: 0.125rem;
  cursor: pointer;
  display: flex;
  color: var(--label-primary)
}
</style>
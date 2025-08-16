<script lang="ts">
    import ContributorTile from '$lib/components/global/contributor-tile.svelte';
  
    export let contributors = [
      { name: "Alice", avatar_url: "/git_profile.png", profile: "#", role: "RTE" },
      { name: "Bob", avatar_url: "/git_profile.png", profile: "#", role: "SA" },
      { name: "Charlie", avatar_url: "/git_profile.png", profile: "#", role: "PM" },
      { name: "Dana", avatar_url: "/git_profile.png", profile: "#", role: "Developer" },
      { name: "Eve", avatar_url: "/git_profile.png", profile: "#", role: "Developer" },
      { name: "Frank", avatar_url: "/git_profile.png", profile: "#", role: "" },

    ];
  </script>
  
  <div class="grid">
    {#each contributors as c (c.name)}
      <a href={c.profile} target="_blank" rel="noopener noreferrer" class="tile-link">
        <ContributorTile name={c.name} avatarUrl={c.avatar_url} role={c.role} />
      </a>
    {/each}
  </div>
  
  <style>
    .grid {
      display: flex;
      flex-wrap: wrap;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 2rem; 
      justify-content: center;
      padding-top: 2rem;
      padding-bottom: 2rem;
      box-sizing: border-box;
      max-width: 100%;
    }
  
    @media (min-width: 960px) {
      .grid {
        grid-template-columns: repeat(3, 280px); 
        justify-content: center;
        gap: 1rem;
      }
    }

    .tile-link {
        text-decoration: none;
        color: inherit;
        display: block;
    }

  
  </style>
  
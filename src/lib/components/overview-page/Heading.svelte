<script lang="ts">
  import { onMount } from "svelte";
  import { createDropdownSelection } from "$lib/stores/dropdown";
  import DropdownTintedMedium from "$lib/components/global/dropdown-tinted-medium.svelte";
  import Icon from "@iconify/svelte";
  import ButtonTintedMedium from "$lib/components/global/button-tinted-medium.svelte";
  import ButtonUnderlineMedium from "$lib/components/global/button-underline-medium.svelte"
  import Calendar from '$lib/components/global/calendar.svelte';


  export let repoPath: string;
  export let repoType = "github";

  let branchOptions = ["main", "devel", "feat/components"];
  let branchSelection = createDropdownSelection(branchOptions[1]);

  let startDate = '01-01-25';
  let endDate   = '20-01-25';

  function onDateChange(e) {
    startDate = e.detail.start;
    endDate   = e.detail.end;
  }

  let selectedView: 'overview' | 'analysis' = 'overview';

  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'chart-line' },
    { id: 'analysis', label: 'Contribution Analysis', icon: 'id' }
  ];


  function selectView(id: 'overview' | 'analysis') {
    selectedView = id;
  }

  function openConfig() {
    //config logic
  }
  
  function openCalendar() {
    //calendar logic
    //task for future sprint
  }

</script>

<div class="page-heading">
  <div class="top-container">
    <div class="display-title">
      {repoPath}
      <Icon icon={`tabler:brand-${repoType}`} class="icon-xlarge" style="color: white" />
    </div>

    <div class="heading-btns">
      <!-- config btn -->
      <ButtonTintedMedium 
        label="Config" 
        icon="settings-2" 
        labelClass="body-accent" 
        iconFirst={true} 
        width="4rem" 
        on:click={openConfig}
      />

      <!-- branch dropdown btn -->
      <DropdownTintedMedium 
        options={branchOptions} 
        selected={branchSelection.selected}
      />

      <!-- calendar btn -->
      <ButtonTintedMedium 
        label="{startDate}  →  {endDate}"
        icon="calendar-month" 
        labelClass="body" 
        iconFirst={false} 
        width="16rem" 
        on:click={openCalendar} 
      />
    
    </div>
  </div>

  <span class="display-subtitle">Contribution Statistics</span>
    <div class="page-select-btns">
      <!-- for each tab -->
        {#each tabs as tab}
        <ButtonUnderlineMedium
          label={tab.label}
          icon={tab.icon}
          selected={selectedView === tab.id}
          width=20rem
          on:click={() => selectView(tab.id)}
        />
      {/each}
    </div>
</div>

<style>
.page-heading {
  display: flex;
  flex-direction: column;
  padding: 2rem;
  margin: 0 auto;
  width: 1200px;

}

.top-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;         
  padding-top: 2rem;
}

.display-title {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 1.5rem;
}

.display-subtitle {
  color: var(--label-secondary);
  padding: 0.6rem 0;
}

.heading-btns {
  display: flex;
  gap: 1rem;
  justify-content: flex-end; 
  align-items: center; 
  padding: 0; 
}

.page-select-btns {
  padding-top: 2rem;
}

</style>
<script lang="ts">
  import { onMount } from "svelte";
  import { createDropdownSelection } from "$lib/stores/dropdown";
  import DropdownTintedMedium from "$lib/components/global/dropdown-tinted-medium.svelte";
  import Icon from "@iconify/svelte";
  import ButtonTintedMedium from "$lib/components/global/button-tinted-medium.svelte";

  export let repoName: string;
  export let repoType = "github";

  let branchOptions = ["main", "devel", "feat/components"];
  let branchSelection = createDropdownSelection(branchOptions[1]);

  function openConfig() {
    // Your config logic
  }

</script>

<div class="page-heading">
  <div class="top-container">
    <div class="display-title">
      {repoName}
      <Icon
        icon={`tabler:brand-${repoType}`}
        class="icon-xlarge"
        style="color: white"
      />
    </div>
    <ButtonTintedMedium label="Config" icon="settings-2" on:click={openConfig} />
    <DropdownTintedMedium options={branchOptions} selected={branchSelection.selected} />

      <!-- title
      config-btn 
      branch dropdwn 
      calendar btn -->

  </div>
  <!-- subheading 
  overview page btn 
  contirbution analysis btn  -->

</div>

<style>
.page-heading {
  display: flex;
  flex-direction: column;
}

.top-container {
  display: flex;
  flex-direction: row;
  align-items: center;
}

.display-title {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 1rem;
  padding: 2rem;
}

</style>

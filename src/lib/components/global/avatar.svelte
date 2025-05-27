<script>
  let { size = "medium", image = null, username = "no user", colour = "--background-tertiary"} = $props();
</script>

<div class={size}>
    {#if image}
        <img class="image" src={image} alt={username}/>
    {:else}
        <div class="image" style={`background-color: var(${colour})`}></div>
    {/if}
</div>

<style>
.image {
    width: 100%;
    height: 100%;
    left: 0px;
    top: 0px;
    position: absolute;
    border-radius: 9999px;
}

.medium {
    width: 18px;
    height: 18px;
    position: relative;
}

.large {
    width: 32px;
    height: 32px;
    position: relative;
}
</style>
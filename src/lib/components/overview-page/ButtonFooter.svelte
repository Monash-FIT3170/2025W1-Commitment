<script lang="ts">
    import ButtonPrimaryMedium from "$lib/components/global/ButtonPrimaryMedium.svelte";
</script>

<div class="bottom-container">
    <ButtonPrimaryMedium icon="table-import" label="Upload Marking Sheet" />

    <ButtonPrimaryMedium
        icon="file-download"
        label="Download Marking Sheet"
    />
</div>

<style>
    .bottom-container {
        flex-direction: row;
        display: flex;
        align-items: center;
        justify-content: center;
        padding-top: 2rem;
        padding-bottom: 4rem;
        gap: 1rem;
    }
</style>
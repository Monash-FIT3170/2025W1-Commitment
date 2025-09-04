<script lang="ts">
    export let progress: number;
    export let label: string = "";
</script>

<div class="w-full">
    {#if label}
        <div class="body label-secondary mb-1">{label}</div>
    {/if}
    <div class="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
        <div
            class="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
            style="width: {progress}%"
        ></div>
    </div>
</div>

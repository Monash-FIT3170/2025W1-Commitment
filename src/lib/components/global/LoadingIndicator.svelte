<script lang="ts">
    import { onMount, onDestroy } from "svelte";

    let {
        displayText = "Loading...",
    }: {
        displayText?: string;
    } = $props();

    let images: string[] = [
        "/loading-indicators/loading-1.svg",
        "/loading-indicators/loading-2.svg",
        "/loading-indicators/loading-3.svg",
        "/loading-indicators/loading-4.svg",
    ];
    let interval: number = 500;

    let currentIndex: number = $state(0);
    let intervalId: number;

    onMount(() => {
        intervalId = window.setInterval(() => {
            currentIndex = (currentIndex + 1) % images.length;
        }, interval);
    });

    onDestroy(() => {
        if (intervalId) {
            clearInterval(intervalId);
        }
    });
</script>

<div class="background-blur">
<div class="loading-indicator">
    <img
        src={images[currentIndex]}
        alt="loading..."
        height="48"
        width="48"
        class="loading-image"
    />
    <div class="display-body">
        {displayText}
    </div>
</div>
</div>

<style>
    .loading-indicator {
        align-items: center;
        justify-content: center;
        display: flex;
        flex-direction: column;
    }

    .background-blur {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(5px);
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
    }
</style>

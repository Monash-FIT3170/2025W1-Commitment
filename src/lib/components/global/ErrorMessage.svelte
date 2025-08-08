<script lang="ts">
    let {
        verification_message = $bindable<string>(),
        error = $bindable<boolean>(),
    } = $props();
</script>

<div class={[{ error }, "verification-feedback", "caption"]}>
                {verification_message == '' ? ' ' : verification_message}
            </div>


<style>
    .verification-feedback {
        height: 1rem;
    }
    .error {
        color: var(--wonderland--ff748b) !important;
    }
</style>
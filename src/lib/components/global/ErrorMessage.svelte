<script lang="ts">
    let {
        verification_message = $bindable<string>(),
        error = $bindable<boolean>(),
    } = $props();
</script>

<!--
@component
This is an error message component that displays user feedback.

- Usage:
  ```svelte
    <ErrorMessage
        verification_message={"There was an error verifying your account."}
        error={true}
    />
  ```
- Props:
    - `verification_message`: The message to display to the user.
    - `error`: A boolean indicating whether the message is an error (true) or
                not. If true, the message will be styled as an error (red).
-->

<div class={[{ error }, "verification-feedback", "caption"]}>
    {verification_message == "" ? " " : verification_message}
</div>

<style>
    .verification-feedback {
        height: 1rem;
    }
    .error {
        color: var(--wonderland--ff748b) !important;
    }
</style>


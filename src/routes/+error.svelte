<script lang="ts">
    import { goto } from "$app/navigation";
    import { page } from "$app/stores";
    import ErrorPage from "$lib/components/error-page.svelte";

    const status = $derived($page.status || 500);

    function handleRetry() {
        window.location.reload();
    }

    function handleGoHome() {
        goto("/");
    }
</script>

<ErrorPage
    code={status}
    onRetry={handleRetry}
    onGoHome={handleGoHome}
/>

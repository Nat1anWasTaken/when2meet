<script lang="ts">
    import { page } from "$app/state";
    import { m } from "$lib/paraglide/messages";
    import LoginForm from "$lib/components/login-form.svelte";

    const redirectTo = page.url.searchParams.get("redirect_to") || "/";
</script>

<svelte:head>
    <title>{m.login_title()} - when2meet.app</title>
    <meta name="description" content={m.login_description()} />
    <meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="flex h-full w-full items-center justify-center px-4">
    <LoginForm {redirectTo} />
</div>

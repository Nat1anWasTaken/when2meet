<script lang="ts">
    import LoginForm from "$lib/components/login-form.svelte";
    import { m } from "$lib/paraglide/messages";
    import { page } from "$app/state";

    const redirectTo = `${page.url.pathname}${page.url.search}`;
</script>

<svelte:head>
    <title>{m.oauth_login_page_title()}</title>
</svelte:head>

<div class="flex min-h-full items-center justify-center p-4">
    <div class="w-full max-w-sm space-y-4 text-center">
        <div>
            <h1 class="text-2xl font-bold">{m.oauth_login_title()}</h1>
            <p class="mt-2 text-sm text-muted-foreground">{m.oauth_login_description()}</p>
        </div>
        <LoginForm {redirectTo} />
    </div>
</div>

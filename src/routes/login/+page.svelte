<script lang="ts">
    import { page } from "$app/state";
    import LoginForm from "$lib/components/login-form.svelte";

    const redirectTo = page.url.searchParams.get("redirect_to") || "/";
</script>

<div class="flex h-full w-full items-center justify-center px-4">
    <LoginForm {redirectTo} />
</div>

<script lang="ts">
    import * as Dialog from "$lib/components/ui/dialog";
    import LoginForm from "$lib/components/login-form.svelte";
    import { page } from "$app/state";
    import type { Snippet } from "svelte";

    interface Props {
        open?: boolean;
        children?: Snippet;
    }

    let { open = $bindable(false), children }: Props = $props();

    // Get the current page URL for redirect after login
    const redirectTo = $derived(page.url.pathname + page.url.search);
</script>

<Dialog.Root bind:open>
    {#if children}
        <Dialog.Trigger>
            {@render children()}
        </Dialog.Trigger>
    {/if}
    <Dialog.Content class="sm:max-w-md">
        <LoginForm {redirectTo} showCard={false} />
    </Dialog.Content>
</Dialog.Root>

<script lang="ts">
    import * as Dialog from "$lib/components/ui/dialog";
    import { Button, type ButtonSize } from "$lib/components/ui/button";
    import LoginForm from "$lib/components/login-form.svelte";
    import { page } from "$app/state";

    interface Props {
        open?: boolean;
        triggerLabel?: string;
        triggerSize?: ButtonSize;
    }

    let { open = $bindable(false), triggerLabel, triggerSize = "default" }: Props = $props();

    // Get the current page URL for redirect after login
    const redirectTo = $derived(page.url.pathname + page.url.search);
</script>

<Dialog.Root bind:open>
    {#if triggerLabel}
        <Dialog.Trigger>
            {#snippet child({ props })}
                <Button {...props} size={triggerSize}>{triggerLabel}</Button>
            {/snippet}
        </Dialog.Trigger>
    {/if}
    <Dialog.Content class="sm:max-w-md">
        <LoginForm {redirectTo} showCard={false} />
    </Dialog.Content>
</Dialog.Root>

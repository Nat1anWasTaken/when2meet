<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import * as Dialog from "$lib/components/ui/dialog";
    import type { SvelteComponent } from "svelte";

    interface Props {
        open: boolean;
        eventName: string;
        inviterName: string;
        onAccept?: () => void;
    }

    let { open = $bindable(), eventName, inviterName, onAccept }: Props = $props();
</script>

<Dialog.Root bind:open>
    <Dialog.Content class="sm:max-w-md">
        <Dialog.Header>
            <Dialog.Title>You're Invited!</Dialog.Title>
            <Dialog.Description>
                {inviterName} has invited you to sign your available times for
                <span class="font-semibold">{eventName}</span>.
            </Dialog.Description>
        </Dialog.Header>
        <div class="flex flex-col gap-3 py-4">
            <p class="text-sm text-muted-foreground">
                Join this event and select the times when you're available to help everyone find the
                best meeting time.
            </p>
        </div>
        <Dialog.Footer class="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
            <Button
                variant="outline"
                onclick={() => {
                    open = false;
                }}>Maybe Later</Button
            >
            <Button
                onclick={() => {
                    open = false;
                    onAccept?.();
                }}>Join & Select Times</Button
            >
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root>

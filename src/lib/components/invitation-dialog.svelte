<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import * as Dialog from "$lib/components/ui/dialog";
    import { m } from "$i18n";

    interface Props {
        open: boolean;
        eventName: string;
        onAccept?: () => void;
        onDecline?: () => void;
    }

    let { open = $bindable(), eventName, onAccept, onDecline }: Props = $props();
</script>

<Dialog.Root bind:open>
    <Dialog.Content class="sm:max-w-md">
        <Dialog.Header>
            <Dialog.Title>{m.invitation_dialog_title()}</Dialog.Title>
            <Dialog.Description>
                {m.invitation_dialog_description({ eventName })}
            </Dialog.Description>
        </Dialog.Header>
        <div class="flex flex-col gap-3 py-4">
            <p class="text-sm text-muted-foreground">
                {m.invitation_dialog_explanation()}
            </p>
        </div>
        <Dialog.Footer class="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
            <Button
                variant="outline"
                onclick={() => {
                    open = false;
                    onDecline?.();
                }}>{m.invitation_dialog_decline()}</Button
            >
            <Button
                onclick={() => {
                    open = false;
                    onAccept?.();
                }}>{m.invitation_dialog_accept()}</Button
            >
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root>

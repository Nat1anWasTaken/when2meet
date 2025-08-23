<script lang="ts">
    import * as Dialog from "$lib/components/ui/dialog";
    import { Button } from "$lib/components/ui/button";
    import { goto } from "$app/navigation";

    interface Props {
        open: boolean;
        onContinueAsGuest: () => void;
    }

    let { open = $bindable(), onContinueAsGuest }: Props = $props();

    function handleLogin() {
        open = false;
        goto("/login");
    }

    function handleCancel() {
        open = false;
    }
</script>

<Dialog.Root bind:open>
    <Dialog.Content class="max-w-md">
        <Dialog.Header>
            <Dialog.Title>Continue as Guest?</Dialog.Title>
            <Dialog.Description>
                You're not logged in. If you continue as a guest, you won't be able to modify your
                availability later.
            </Dialog.Description>
        </Dialog.Header>
        <div class="space-y-4">
            <p class="text-sm text-muted-foreground">
                To be able to edit your participation later, please log in or create an account
                first.
            </p>
            <div class="flex justify-end gap-2">
                <Button variant="outline" onclick={handleCancel}>Cancel</Button>
                <Button variant="secondary" onclick={handleLogin}>Login / Sign Up</Button>
                <Button onclick={onContinueAsGuest}>Continue as Guest</Button>
            </div>
        </div>
    </Dialog.Content>
</Dialog.Root>

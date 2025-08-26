<script lang="ts">
    import * as Dialog from "$lib/components/ui/dialog";
    import { Button } from "$lib/components/ui/button";
    import { goto } from "$app/navigation";
    import { m } from "$i18n";

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
            <Dialog.Title>{m.guest_warning_dialog_title()}</Dialog.Title>
            <Dialog.Description>
                {m.guest_warning_dialog_description()}
            </Dialog.Description>
        </Dialog.Header>
        <div class="space-y-4">
            <p class="text-sm text-muted-foreground">
                {m.guest_warning_additional_info()}
            </p>
            <div class="flex justify-end gap-2">
                <Button variant="outline" onclick={handleCancel}
                    >{m.guest_warning_button_cancel()}</Button
                >
                <Button variant="secondary" onclick={handleLogin}
                    >{m.guest_warning_button_login()}</Button
                >
                <Button onclick={onContinueAsGuest}
                    >{m.guest_warning_button_continue_guest()}</Button
                >
            </div>
        </div>
    </Dialog.Content>
</Dialog.Root>

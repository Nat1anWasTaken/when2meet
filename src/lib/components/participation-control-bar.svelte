<script lang="ts">
    import { createParticipant, updateParticipant } from "$lib/api/participants.remote";
    import { authClient } from "$lib/auth-client";
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import IconLoaderCircle from "~icons/lucide/loader-circle";
    import { toast } from "svelte-sonner";
    import { backOut } from "svelte/easing";
    import { fly } from "svelte/transition";
    import GuestWarningDialog from "./guest-warning-dialog.svelte";
    import { m } from "$i18n";

    interface Props {
        eventId: string;
        selectedTimes: { startTime: Date; endTime: Date }[];
        existingParticipant: {
            id: number;
            username: string;
            timeSelection: { startTime: Date; endTime: Date }[];
        } | null;
        onSuccess: () => void;
        onCancel: () => void;
    }

    let { eventId, selectedTimes, existingParticipant, onSuccess, onCancel }: Props = $props();

    let userAlreadyJoined = $derived(!!existingParticipant);

    const session = authClient.useSession();

    let participantName = $state(existingParticipant?.username || "");
    let inputRef = $state<HTMLInputElement | null>(null);

    let isSaving = $state(false);
    let showWarningDialog = $state(false);
    let validationErrorMessage = $state<string | undefined>(undefined);

    export function focusInput() {
        inputRef?.focus();
    }

    async function handleSave() {
        validationErrorMessage = undefined;

        if (!participantName.trim()) {
            validationErrorMessage = m.participation_control_bar_error_name_required();
            return;
        }

        if (selectedTimes.length === 0) {
            validationErrorMessage = m.participation_control_bar_error_no_time_selected();
            return;
        }

        const sessionData = $session.data;
        if (!sessionData) {
            showWarningDialog = true;
            return;
        }

        await submitParticipation();
    }

    async function submitParticipation() {
        isSaving = true;

        try {
            if (userAlreadyJoined && existingParticipant) {
                await updateParticipant({
                    participantId: existingParticipant.id,
                    username: participantName,
                    timeSelection: selectedTimes.map((t) => ({
                        startTime: t.startTime.toISOString(),
                        endTime: t.endTime.toISOString()
                    }))
                });
                toast.success(m.participation_control_bar_success_updated());
            } else {
                await createParticipant({
                    eventId,
                    username: participantName,
                    timeSelection: selectedTimes.map((t) => ({
                        startTime: t.startTime.toISOString(),
                        endTime: t.endTime.toISOString()
                    }))
                });
                toast.success(m.participation_control_bar_success_saved());
            }

            onSuccess();
        } catch {
            validationErrorMessage = m.participation_control_bar_error_save_failed();
        } finally {
            isSaving = false;
        }
    }
</script>

<svelte:window
    onkeydown={(event) => {
        if (event.key == "Enter") {
            handleSave();
            return;
        } else if (event.key == "Escape") {
            onCancel();
            return;
        }
    }}
/>

<div
    class="fixed right-4 bottom-4 left-4 z-50 mx-auto max-w-3xl rounded-lg border border-accent bg-background/95 p-4 shadow-xl backdrop-blur supports-[backdrop-filter]:bg-background/80"
    in:fly={{ y: 100, duration: 500, easing: backOut }}
    out:fly={{ y: 100, duration: 300 }}
>
    <div class="flex flex-col items-center gap-4 sm:flex-row sm:items-end">
        <div class="w-full flex-1 sm:w-auto">
            <div class="mb-1 flex items-center gap-2">
                <Label for="floatingName" class="text-sm text-muted-foreground">{m.participation_control_bar_label_your_name()}</Label>
                {#if !$session.data}
                    <span class="text-sm text-muted-foreground/60 italic">
                        💡 {m.participation_control_bar_warning_guest_edit()}
                    </span>
                {/if}
            </div>
            <Input
                bind:ref={inputRef}
                id="floatingName"
                bind:value={participantName}
                placeholder={m.participation_control_bar_placeholder_name()}
                disabled={isSaving}
                class="transition-all duration-200"
            />
        </div>

        <div class="flex flex-col items-end gap-2">
            {#if validationErrorMessage}
                <p class="text-sm text-destructive">{validationErrorMessage}</p>
            {/if}
            <div class="flex items-center gap-2">
                <Button
                    variant="outline"
                    onclick={onCancel}
                    disabled={isSaving}
                    class="transition-all duration-200"
                >
                    {m.participation_control_bar_button_cancel()}
                </Button>

                <Button
                    onclick={handleSave}
                    disabled={isSaving || !participantName.trim()}
                    class="min-w-24"
                >
                    {#if isSaving}
                        <div class="flex items-center gap-2">
                            <IconLoaderCircle class="h-4 w-4 animate-spin" />
                            {userAlreadyJoined ? m.participation_control_bar_button_updating() : m.participation_control_bar_button_saving()}
                        </div>
                    {:else}
                        {userAlreadyJoined ? m.participation_control_bar_button_update() : m.participation_control_bar_button_save()} ({selectedTimes.length} {m.participation_control_bar_slots()})
                    {/if}
                </Button>
            </div>
        </div>
    </div>
</div>

<!-- Guest Warning Dialog -->
<GuestWarningDialog
    bind:open={showWarningDialog}
    onContinueAsGuest={() => {
        showWarningDialog = false;
        submitParticipation();
    }}
/>

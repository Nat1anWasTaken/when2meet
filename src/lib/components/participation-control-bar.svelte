<script lang="ts">
    import { createParticipant, updateParticipant } from "$lib/api/participants.remote";
    import { authClient } from "$lib/auth-client";
    import { Button } from "$lib/components/ui/button";
    import * as Dialog from "$lib/components/ui/dialog";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import { getLocale } from "$lib/paraglide/runtime";
    import IconLoaderCircle from "~icons/lucide/loader-circle";
    import { toast } from "svelte-sonner";
    import { backOut } from "svelte/easing";
    import { fly } from "svelte/transition";
    import GuestWarningDialog from "./guest-warning-dialog.svelte";
    import { m } from "$i18n";
    import type { Cell } from "$lib/utils";

    interface Props {
        eventId: string;
        selectedTimes: { startTime: Date; endTime: Date }[];
        selectedCells: Cell[];
        existingParticipant: {
            id: number;
            username: string;
            timeSelection: { startTime: Date; endTime: Date }[];
        } | null;
        onSuccess: () => void;
        onCancel: () => void;
    }

    let { eventId, selectedTimes, selectedCells, existingParticipant, onSuccess, onCancel }: Props =
        $props();

    let userAlreadyJoined = $derived(!!existingParticipant);

    const session = authClient.useSession();

    let participantName = $state(existingParticipant?.username || "");
    let desktopInputRef = $state<HTMLInputElement | null>(null);
    let mobileInputRef = $state<HTMLInputElement | null>(null);
    let mobileContinueRef = $state<HTMLButtonElement | null>(null);

    let isSaving = $state(false);
    let showWarningDialog = $state(false);
    let mobileConfirmOpen = $state(false);
    let mobileConfirmWasOpen = $state(false);
    let validationErrorMessage = $state<string | undefined>(undefined);

    let selectedDayCount = $derived(new Set(selectedCells.map(([day]) => day)).size);

    $effect(() => {
        if (mobileConfirmOpen) {
            mobileConfirmWasOpen = true;
            return;
        }

        if (mobileConfirmWasOpen) {
            mobileConfirmWasOpen = false;
            if (!showWarningDialog) {
                setTimeout(() => mobileContinueRef?.focus());
            }
        }
    });

    function formatUnit(value: number, unit: "day" | "hour") {
        return new Intl.NumberFormat(getLocale() === "zh-hant-tw" ? "zh-TW" : "en-US", {
            style: "unit",
            unit,
            unitDisplay: "long"
        }).format(value);
    }

    export function focusInput() {
        if (window.matchMedia("(min-width: 768px)").matches) {
            desktopInputRef?.focus();
        }
    }

    function openMobileConfirmation() {
        validationErrorMessage = undefined;
        if (selectedTimes.length === 0) return;

        mobileConfirmOpen = true;
        setTimeout(() => mobileInputRef?.focus(), 100);
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
            mobileConfirmOpen = false;
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
            const errorMessage = m.participation_control_bar_error_save_failed();
            validationErrorMessage = errorMessage;
            toast.error(errorMessage);
            if (window.matchMedia("(max-width: 767px)").matches) {
                mobileConfirmOpen = true;
            }
        } finally {
            isSaving = false;
        }
    }
</script>

<svelte:window
    onkeydown={(event) => {
        const isDesktop = window.matchMedia("(min-width: 768px)").matches;
        if (event.key == "Enter" && (isDesktop || mobileConfirmOpen)) {
            handleSave();
            return;
        } else if (event.key == "Escape") {
            const eventStartedInDialog =
                event.target instanceof Element && event.target.closest('[role="dialog"]');
            if (mobileConfirmOpen || eventStartedInDialog) {
                return;
            }
            onCancel();
            return;
        }
    }}
/>

<div
    class="fixed right-4 bottom-4 left-4 z-50 mx-auto hidden max-w-3xl rounded-lg border border-accent bg-background/95 p-4 shadow-xl backdrop-blur supports-[backdrop-filter]:bg-background/80 md:block"
    in:fly={{ y: 100, duration: 500, easing: backOut }}
    out:fly={{ y: 100, duration: 300 }}
>
    <div class="flex flex-col items-center gap-4 sm:flex-row sm:items-end">
        <div class="w-full flex-1 sm:w-auto">
            <div class="mb-1 flex items-center gap-2">
                <Label for="floatingName" class="text-sm text-muted-foreground"
                    >{m.participation_control_bar_label_your_name()}</Label
                >
                {#if !$session.data}
                    <span class="text-sm text-muted-foreground/60 italic">
                        💡 {m.participation_control_bar_warning_guest_edit()}
                    </span>
                {/if}
            </div>
            <Input
                bind:ref={desktopInputRef}
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
                            {userAlreadyJoined
                                ? m.participation_control_bar_button_updating()
                                : m.participation_control_bar_button_saving()}
                        </div>
                    {:else}
                        {userAlreadyJoined
                            ? m.participation_control_bar_button_update()
                            : m.participation_control_bar_button_save()} ({selectedTimes.length}
                        {m.participation_control_bar_slots()})
                    {/if}
                </Button>
            </div>
        </div>
    </div>
</div>

<div
    class="fixed right-2 bottom-2 left-2 z-50 rounded-xl border border-accent bg-background/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-xl backdrop-blur supports-[backdrop-filter]:bg-background/85 md:hidden"
    in:fly={{ y: 100, duration: 350, easing: backOut }}
    out:fly={{ y: 100, duration: 250 }}
>
    <div class="mb-2 flex items-center justify-between gap-3">
        <div class="min-w-0">
            <p class="text-sm font-semibold">
                {m.participation_mobile_summary({
                    days: formatUnit(selectedDayCount, "day"),
                    hours: formatUnit(selectedTimes.length, "hour")
                })}
            </p>
            <p class="truncate text-xs text-muted-foreground">
                {m.participation_mobile_summary_hint()}
            </p>
        </div>
        <Button variant="ghost" size="sm" class="h-11" onclick={onCancel} disabled={isSaving}>
            {m.participation_control_bar_button_cancel()}
        </Button>
    </div>
    <Button
        bind:ref={mobileContinueRef}
        class="h-11 w-full"
        onclick={openMobileConfirmation}
        disabled={isSaving || selectedTimes.length === 0}
    >
        {m.participation_mobile_continue()}
    </Button>
</div>

<Dialog.Root bind:open={mobileConfirmOpen}>
    <Dialog.Content>
        <Dialog.Header>
            <Dialog.Title>{m.participation_mobile_confirm_title()}</Dialog.Title>
            <Dialog.Description>
                {m.participation_mobile_confirm_description({
                    days: formatUnit(selectedDayCount, "day"),
                    hours: formatUnit(selectedTimes.length, "hour")
                })}
            </Dialog.Description>
        </Dialog.Header>

        <div class="space-y-2">
            <Label for="mobileParticipantName">
                {m.participation_control_bar_label_your_name()}
            </Label>
            <Input
                bind:ref={mobileInputRef}
                id="mobileParticipantName"
                bind:value={participantName}
                placeholder={m.participation_control_bar_placeholder_name()}
                disabled={isSaving}
                class="h-11"
            />
            {#if !$session.data}
                <p class="text-xs text-muted-foreground">
                    💡 {m.participation_control_bar_warning_guest_edit()}
                </p>
            {/if}
            {#if validationErrorMessage}
                <p class="text-sm text-destructive">{validationErrorMessage}</p>
            {/if}
        </div>

        <Dialog.Footer>
            <Button
                variant="outline"
                class="h-11"
                onclick={() => (mobileConfirmOpen = false)}
                disabled={isSaving}
            >
                {m.participation_control_bar_button_cancel()}
            </Button>
            <Button
                class="h-11"
                onclick={handleSave}
                disabled={isSaving || !participantName.trim()}
            >
                {#if isSaving}
                    <IconLoaderCircle class="h-4 w-4 animate-spin" />
                    {userAlreadyJoined
                        ? m.participation_control_bar_button_updating()
                        : m.participation_control_bar_button_saving()}
                {:else}
                    {userAlreadyJoined
                        ? m.participation_control_bar_button_update()
                        : m.participation_control_bar_button_save()}
                {/if}
            </Button>
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root>

<!-- Guest Warning Dialog -->
<GuestWarningDialog
    bind:open={showWarningDialog}
    {selectedCells}
    onContinueAsGuest={() => {
        showWarningDialog = false;
        submitParticipation();
    }}
/>

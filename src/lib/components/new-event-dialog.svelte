<script lang="ts">
    import { goto, refreshAll } from "$app/navigation";
    import { m } from "$i18n";
    import { createEvent } from "$lib/api/events.remote";
    import { authClient } from "$lib/auth-client";
    import { Button } from "$lib/components/ui/button";
    import * as Dialog from "$lib/components/ui/dialog/";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import { preservedEventNames } from "$lib/utils";
    import { Time, toCalendarDateTime } from "@internationalized/date";
    import type { DateRange } from "bits-ui";
    import type { Snippet } from "svelte";
    import { toast } from "svelte-sonner";
    import DateRangeSelect from "./date-range-select.svelte";
    import TimezoneSelect from "./timezone-select.svelte";
    import { localizeHref } from "$lib/paraglide/runtime";

    interface Props {
        children: Snippet;
        redirect?: boolean;
    }

    let { children, redirect = false }: Props = $props();

    const session = authClient.useSession();

    let canCreate = $state<boolean>(true);

    let open = $state<boolean>(false);
    let validationErrorMessage = $state<string | undefined>(undefined);

    let eventName = $state<string>("");
    let organizerName = $state<string>("");

    let selectedDateRange = $state<DateRange | undefined>(undefined);

    let selectedTimezone = $state<string | undefined>(
        Intl.DateTimeFormat().resolvedOptions().timeZone
    );

    let startingDateTime = $derived(
        selectedDateRange?.start
            ? toCalendarDateTime(selectedDateRange.start, new Time(0, 0))
            : undefined
    );

    let endingDateTime = $derived(
        selectedDateRange?.end
            ? toCalendarDateTime(selectedDateRange.end, new Time(23, 59, 59, 999))
            : undefined
    );

    const resetForm = () => {
        validationErrorMessage = undefined;

        eventName = "";
        organizerName = "";
        selectedDateRange = undefined;
        selectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    };

    const validateFormData = () => {
        let missingFields = [];

        if (eventName.trim() === "") {
            missingFields.push(m.new_event_field_name());
        }

        if (organizerName.trim() === "") {
            missingFields.push(m.new_event_field_organizer_name());
        }

        if (!selectedDateRange) {
            missingFields.push(m.new_event_field_date_range());
        }

        if (!selectedTimezone) {
            missingFields.push(m.new_event_field_timezone());
        }

        if (missingFields.length > 0) {
            validationErrorMessage =
                m.new_event_validation_missing_fields() + missingFields.join(", ");
            return false;
        }

        if (preservedEventNames.includes(eventName.trim())) {
            validationErrorMessage = m.new_event_validation_reserved_name({
                eventName: eventName.trim()
            });
            return false;
        }

        validationErrorMessage = undefined;
        return true;
    };

    const handleCreateEvent = async () => {
        canCreate = false;

        if (!validateFormData()) {
            canCreate = true;
            return;
        }

        try {
            const event = await createEvent({
                name: eventName.trim(),
                organizerName: organizerName.trim(),
                availableTime: {
                    startTime: startingDateTime!.toString(),
                    endTime: endingDateTime!.toString()
                },
                timezone: selectedTimezone!,
                weeklyRecurrence: false
            });

            open = false; // Close dialog

            toast.info(
                m.toast_event_created_success({ eventName: eventName.trim() }) +
                    (redirect ? m.new_event_success_redirecting() : "")
            );

            if (redirect) {
                await goto(localizeHref(`/${event.id}`));
            }

            refreshAll();
        } catch (error) {
            console.error("Failed to create event:", error);
            toast.error(m.new_event_error_title(), {
                description: `${error}`
            });
        } finally {
            canCreate = true;
        }
    };

    // Reset the form when dialog opens
    $effect(() => {
        if (open) {
            resetForm();
        }
    });
</script>

<svelte:window
    onkeydown={(event) => {
        if (event.key === "Enter") {
            handleCreateEvent();
        }
    }}
/>

<Dialog.Root bind:open>
    <Dialog.Trigger>
        {@render children()}
    </Dialog.Trigger>
    <Dialog.Content>
        <Dialog.Header>
            <Dialog.Title>{m.new_event_dialog_title()}</Dialog.Title>
            <Dialog.Description>{m.new_event_dialog_description()}</Dialog.Description>
        </Dialog.Header>

        <div class="flex flex-col gap-4">
            <div class="flex flex-col gap-2">
                <Label>{m.new_event_label_event_name()}</Label>
                <Input placeholder={m.new_event_placeholder_event_name()} bind:value={eventName} />
            </div>

            <div class="flex flex-col gap-2">
                <Label>{m.new_event_label_organizer_name()}</Label>
                <Input
                    placeholder={m.new_event_placeholder_organizer_name()}
                    bind:value={organizerName}
                />
            </div>

            <div class="flex flex-col gap-2">
                <Label>{m.new_event_label_date_range()}</Label>
                <div class="grid grid-cols-4 grid-rows-2 gap-2" style="place-items: center start;">
                    <p class=" col-span-1 text-xs text-muted-foreground">
                        {m.new_event_sublabel_date_range()}
                    </p>
                    <DateRangeSelect class="col-span-3 w-full" bind:selectedDateRange />
                    <p class="col-span-1 text-xs text-muted-foreground">
                        {m.new_event_sublabel_timezone()}
                    </p>
                    <TimezoneSelect class="col-span-3 w-full" bind:selectedTimezone />
                </div>
            </div>

            <div class="flex flex-col gap-2">
                {#if validationErrorMessage}
                    <p class="text-sm text-destructive">{validationErrorMessage}</p>
                {/if}
                <Button class="w-full" onclick={handleCreateEvent} disabled={!canCreate}>
                    {m.new_event_button_create()}
                </Button>
                {#if !$session.data?.user}
                    <p class="text-sm text-muted-foreground">
                        {m.new_event_login_warning()}
                    </p>
                {/if}
            </div>
        </div>
    </Dialog.Content>
</Dialog.Root>

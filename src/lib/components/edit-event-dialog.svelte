<script lang="ts">
    import { refreshAll } from "$app/navigation";
    import { deleteEvent, updateEvent } from "$lib/api/events.remote";
    import { Button } from "$lib/components/ui/button";
    import * as Dialog from "$lib/components/ui/dialog/";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import * as RadioGroup from "$lib/components/ui/radio-group";
    import { preservedEventNames } from "$lib/utils";
    import { CalendarDate, Time, toCalendarDateTime } from "@internationalized/date";
    import type { DateRange } from "bits-ui";
    import type { Snippet } from "svelte";
    import { toast } from "svelte-sonner";
    import DateRangeSelect from "./date-range-select.svelte";
    import TimezoneSelect from "./timezone-select.svelte";
    import { m } from "$i18n";

    type WeeklyRecurrence = "weekly" | "once";

    interface Props {
        children: Snippet;
        eventId: string;
        name?: string;
        organizerName?: string;
        weeklyRecurrence?: boolean;
        availableTime?: {
            startTime: Date;
            endTime: Date;
        };
        timezone?: string;
    }

    let {
        children,
        eventId,
        name = $bindable(""),
        organizerName = $bindable(""),
        weeklyRecurrence = $bindable(false),
        availableTime = $bindable(),
        timezone = $bindable()
    }: Props = $props();

    let canUpdate = $state<boolean>(true);
    let canDelete = $state<boolean>(true);

    let open = $state<boolean>(false);
    let validationErrorMessage = $state<string | undefined>(undefined);

    let weeklyRecurrenceState = $state<WeeklyRecurrence>(weeklyRecurrence ? "weekly" : "once");

    // Convert initial dates to DateRange format
    let selectedDateRange = $state<DateRange | undefined>(
        availableTime
            ? {
                  start: new CalendarDate(
                      availableTime.startTime.getFullYear(),
                      availableTime.startTime.getMonth() + 1,
                      availableTime.startTime.getDate()
                  ),
                  end: new CalendarDate(
                      availableTime.endTime.getFullYear(),
                      availableTime.endTime.getMonth() + 1,
                      availableTime.endTime.getDate()
                  )
              }
            : undefined
    );

    let selectedWeeklyRecurrence = $derived(weeklyRecurrenceState === "weekly");

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
        weeklyRecurrenceState = weeklyRecurrence ? "weekly" : "once";
        selectedDateRange = availableTime
            ? {
                  start: new CalendarDate(
                      availableTime.startTime.getFullYear(),
                      availableTime.startTime.getMonth() + 1,
                      availableTime.startTime.getDate()
                  ),
                  end: new CalendarDate(
                      availableTime.endTime.getFullYear(),
                      availableTime.endTime.getMonth() + 1,
                      availableTime.endTime.getDate()
                  )
              }
            : undefined;
    };

    const validateFormData = () => {
        let missingFields = [];

        if (!name || name.trim() === "") {
            missingFields.push(m.edit_event_field_name());
        }

        if (!organizerName || organizerName.trim() === "") {
            missingFields.push(m.edit_event_field_organizer_name());
        }

        if (!selectedDateRange) {
            missingFields.push(m.edit_event_field_date_range());
        }

        if (!timezone) {
            missingFields.push(m.edit_event_field_timezone());
        }

        if (missingFields.length > 0) {
            validationErrorMessage = m.edit_event_validation_missing_fields() + missingFields.join(", ");
            return false;
        }

        if (preservedEventNames.includes(name.trim())) {
            validationErrorMessage = m.edit_event_validation_reserved_name({ name: name.trim() });
            return false;
        }

        validationErrorMessage = undefined;
        return true;
    };

    const handleUpdateEvent = async () => {
        canUpdate = false;

        if (!validateFormData()) {
            canUpdate = true;
            return;
        }

        try {
            await updateEvent({
                id: eventId,
                name: name!.trim(),
                organizerName: organizerName!.trim(),
                availableTime: {
                    startTime: startingDateTime!.toString(),
                    endTime: endingDateTime!.toString()
                },
                timezone: timezone!,
                weeklyRecurrence: selectedWeeklyRecurrence
            });

            // Update bindable props to reflect changes
            weeklyRecurrence = selectedWeeklyRecurrence;
            if (startingDateTime && endingDateTime) {
                availableTime = {
                    startTime: new Date(startingDateTime.toString()),
                    endTime: new Date(endingDateTime.toString())
                };
            }

            open = false; // Close dialog

            refreshAll();
            toast.success(m.edit_event_success_message());
        } catch (error) {
            console.error("Failed to update event:", error);
            toast.error(m.edit_event_error_update_title(), {
                description: `${error}`
            });
        } finally {
            canUpdate = true;
        }
    };

    const handleDeleteEvent = async () => {
        canDelete = false;

        try {
            await deleteEvent({ id: eventId });

            open = false; // Close dialog
            refreshAll();
            toast.success(m.edit_event_success_delete_message());
        } catch (error) {
            console.error("Failed to delete event:", error);
            toast.error(m.edit_event_error_delete_title(), {
                description: `${error}`
            });
        } finally {
            canDelete = true;
        }
    };

    // Reset form when dialog opens
    $effect(() => {
        if (open) {
            resetForm();
        }
    });
</script>

<Dialog.Root bind:open>
    <Dialog.Trigger>
        {@render children()}
    </Dialog.Trigger>
    <Dialog.Content>
        <Dialog.Header>
            <Dialog.Title>{m.edit_event_dialog_title()}</Dialog.Title>
            <Dialog.Description>{m.edit_event_dialog_description()}</Dialog.Description>
        </Dialog.Header>

        <div class="flex flex-col gap-4">
            <div class="flex flex-col gap-2">
                <Label>{m.edit_event_label_event_name()}</Label>
                <Input placeholder={m.edit_event_placeholder_event_name()} bind:value={name} />
            </div>

            <div class="flex flex-col gap-2">
                <Label>{m.edit_event_label_organizer_name()}</Label>
                <Input placeholder={m.edit_event_placeholder_organizer_name()} bind:value={organizerName} />
            </div>

            <div class="flex flex-col gap-2">
                <Label class="flex items-center gap-2">{m.edit_event_label_weekly_recurring()}</Label>
                <RadioGroup.Root bind:value={weeklyRecurrenceState}>
                    <div class="flex flex-row items-center gap-2">
                        <RadioGroup.Item value="weekly" id="weekly" />
                        <Label for="weekly">{m.edit_event_option_weekly_yes()}</Label>
                    </div>
                    <div class="flex flex-row items-center gap-2">
                        <RadioGroup.Item value="once" id="once" />
                        <Label for="once">{m.edit_event_option_weekly_no()}</Label>
                    </div>
                </RadioGroup.Root>
            </div>

            <div class="flex flex-col gap-2">
                <Label>{m.edit_event_label_date_range()}</Label>
                <div class="grid grid-cols-4 grid-rows-2 gap-2" style="place-items: center start;">
                    <p class=" col-span-1 text-xs text-muted-foreground">{m.edit_event_sublabel_date_range()}</p>
                    <DateRangeSelect
                        class="col-span-3 w-full"
                        bind:selectedDateRange
                        maxDays={weeklyRecurrence ? 7 : undefined}
                    />
                    <p class="col-span-1 text-xs text-muted-foreground">{m.edit_event_sublabel_timezone()}</p>
                    <TimezoneSelect class="col-span-3 w-full" bind:selectedTimezone={timezone} />
                </div>
            </div>

            <div class="flex flex-col gap-2">
                {#if validationErrorMessage}
                    <p class="text-sm text-destructive">{validationErrorMessage}</p>
                {/if}
                <div class="flex gap-2">
                    <Button variant="destructive" onclick={handleDeleteEvent} disabled={!canDelete}>
                        {m.edit_event_button_delete()}
                    </Button>
                    <Button class="flex-1" variant="outline" onclick={() => (open = false)}>
                        {m.edit_event_button_cancel()}
                    </Button>
                    <Button class="flex-1" onclick={handleUpdateEvent} disabled={!canUpdate}>
                        {m.edit_event_button_update()}
                    </Button>
                </div>
            </div>
        </div>
    </Dialog.Content>
</Dialog.Root>

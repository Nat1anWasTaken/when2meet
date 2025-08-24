<script lang="ts">
    import { refreshAll } from "$app/navigation";
    import { updateEvent, deleteEvent } from "$lib/api/events.remote";
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
            missingFields.push("Event Name");
        }

        if (!organizerName || organizerName.trim() === "") {
            missingFields.push("Organizer Name");
        }

        if (!selectedDateRange) {
            missingFields.push("Date Range");
        }

        if (!timezone) {
            missingFields.push("Timezone");
        }

        if (missingFields.length > 0) {
            validationErrorMessage = `Please fill in the following fields: ${missingFields.join(", ")}`;
            return false;
        }

        if (preservedEventNames.includes(name.trim())) {
            validationErrorMessage = `Event name "${name.trim()}" is reserved.`;
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
            toast.success("Event updated successfully");
        } catch (error) {
            console.error("Failed to update event:", error);
            toast.error("Failed to update event", {
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
            toast.success("Event deleted successfully");
        } catch (error) {
            console.error("Failed to delete event:", error);
            toast.error("Failed to delete event", {
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
            <Dialog.Title>Edit Event</Dialog.Title>
            <Dialog.Description>Update your event details</Dialog.Description>
        </Dialog.Header>

        <div class="flex flex-col gap-4">
            <div class="flex flex-col gap-2">
                <Label>What is the event called?</Label>
                <Input placeholder="Event Name" bind:value={name} />
            </div>

            <div class="flex flex-col gap-2">
                <Label>Who is the organizer?</Label>
                <Input placeholder="Organizer Name" bind:value={organizerName} />
            </div>

            <div class="flex flex-col gap-2">
                <Label>What date range might work?</Label>
                <div class="grid grid-cols-4 grid-rows-2 gap-2" style="place-items: center start;">
                    <p class=" col-span-1 text-xs text-muted-foreground">Date range:</p>
                    <DateRangeSelect class="col-span-3 w-full" bind:selectedDateRange />
                    <p class="col-span-1 text-xs text-muted-foreground">Timezone:</p>
                    <TimezoneSelect class="col-span-3 w-full" bind:selectedTimezone={timezone} />
                </div>
            </div>

            <div class="flex flex-col gap-2">
                <Label class="flex items-center gap-2">Is this a weekly recurring event?</Label>
                <RadioGroup.Root bind:value={weeklyRecurrenceState}>
                    <div class="flex flex-row items-center gap-2">
                        <RadioGroup.Item value="weekly" id="weekly" />
                        <Label for="weekly">Yes, it's recurring every week</Label>
                    </div>
                    <div class="flex flex-row items-center gap-2">
                        <RadioGroup.Item value="once" id="once" />
                        <Label for="once">No, it's a one-time event</Label>
                    </div>
                </RadioGroup.Root>
            </div>

            <div class="flex flex-col gap-2">
                {#if validationErrorMessage}
                    <p class="text-sm text-destructive">{validationErrorMessage}</p>
                {/if}
                <div class="flex gap-2">
                    <Button variant="destructive" onclick={handleDeleteEvent} disabled={!canDelete}>
                        Delete
                    </Button>
                    <Button class="flex-1" variant="outline" onclick={() => (open = false)}>
                        Cancel
                    </Button>
                    <Button class="flex-1" onclick={handleUpdateEvent} disabled={!canUpdate}>
                        Update Event
                    </Button>
                </div>
            </div>
        </div>
    </Dialog.Content>
</Dialog.Root>

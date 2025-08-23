<script lang="ts">
    import { refreshAll } from "$app/navigation";
    import { createEvent } from "$lib/api/events.remote";
    import { Button } from "$lib/components/ui/button";
    import * as Dialog from "$lib/components/ui/dialog/";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import * as RadioGroup from "$lib/components/ui/radio-group";
    import { RangeCalendar } from "$lib/components/ui/range-calendar";
    import { preservedEventNames } from "$lib/utils";
    import { Time, toCalendarDateTime } from "@internationalized/date";
    import type { DateRange } from "bits-ui";
    import type { Snippet } from "svelte";
    import { toast } from "svelte-sonner";
    import DateRangeSelect from "./date-range-select.svelte";
    import TimezoneSelect from "./timezone-select.svelte";

    type WeeklyRecurrence = "weekly" | "once";

    interface Props {
        children: Snippet;
    }

    let { children }: Props = $props();

    let canCreate = $state<boolean>(true);

    let open = $state<boolean>(false);
    let validationErrorMessage = $state<string | undefined>(undefined);

    let eventName = $state<string>("");
    let organizerName = $state<string>("");
    let weeklyRecurrence = $state<WeeklyRecurrence>("weekly");

    let selectedDateRange = $state<DateRange | undefined>(undefined);

    let selectedTimezone = $state<string | undefined>(
        Intl.DateTimeFormat().resolvedOptions().timeZone
    );

    let selectedWeeklyRecurrence = $derived(weeklyRecurrence === "weekly");

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
        weeklyRecurrence = "weekly";
        selectedDateRange = undefined;
        selectedTimezone = undefined;
    };

    const validateFormData = () => {
        let missingFields = [];

        if (eventName.trim() === "") {
            missingFields.push("Event Name");
        }

        if (organizerName.trim() === "") {
            missingFields.push("Organizer Name");
        }

        if (!selectedDateRange) {
            missingFields.push("Date Range");
        }

        if (!selectedTimezone) {
            missingFields.push("Timezone");
        }

        if (missingFields.length > 0) {
            validationErrorMessage = `Please fill in the following fields: ${missingFields.join(", ")}`;
            return false;
        }

        if (preservedEventNames.includes(eventName.trim())) {
            validationErrorMessage = `Event name "${eventName.trim()}" is reserved.`;
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
            await createEvent({
                name: eventName.trim(),
                organizerName: organizerName.trim(),
                availableTime: {
                    startTime: startingDateTime!.toString(),
                    endTime: endingDateTime!.toString()
                },
                timezone: selectedTimezone!,
                weeklyRecurrence: selectedWeeklyRecurrence
            });

            open = false; // Close dialog

            resetForm();
            refreshAll();
        } catch (error) {
            console.error("Failed to create event:", error);
            toast.error("Failed to create event", {
                description: `${error}`
            });
        } finally {
            canCreate = true;
        }
    };
</script>

<Dialog.Root bind:open>
    <Dialog.Trigger>
        {@render children()}
    </Dialog.Trigger>
    <Dialog.Content>
        <Dialog.Header>
            <Dialog.Title>New Event</Dialog.Title>
            <Dialog.Description>create a new event</Dialog.Description>
        </Dialog.Header>

        <div class="flex flex-col gap-4">
            <div class="flex flex-col gap-2">
                <Label>What is the event called?</Label>
                <Input placeholder="Event Name" bind:value={eventName} />
            </div>

            <div class="flex flex-col gap-2">
                <Label>Who is the organizer?</Label>
                <Input placeholder="Organizer Name" bind:value={organizerName} />
            </div>

            <div class="flex flex-col gap-2">
                <Label>What date range might work?</Label>
                <div class="grid grid-cols-4 grid-rows-2 gap-2" style="place-items: center start;">
                    <p class=" col-span-1 text-xs text-muted-foreground">Date range:</p>
                    <!-- <RangeCalendar
                        bind:value={selectedDateRange}
                        class="flex w-full items-center justify-center"
                    /> -->
                    <DateRangeSelect class="col-span-3 w-full" bind:selectedDateRange />
                    <p class="col-span-1 text-xs text-muted-foreground">Timezone:</p>
                    <TimezoneSelect class="col-span-3 w-full" bind:selectedTimezone />
                </div>
                <!-- <div class="flex w-full flex-col items-start justify-between gap-2">
                    <p class="text-xs text-muted-foreground">
                        Select date range (time will be set from 00:00 to 23:59):
                    </p>
                    <RangeCalendar
                        bind:value={selectedDateRange}
                        class="flex w-full items-center justify-center"
                    />
                    <div class="flex w-full flex-col gap-2 md:flex-row md:items-center">
                        <p class="text-xs text-muted-foreground">Timezone:</p>
                        <TimezoneSelect class="w-full md:w-auto" bind:selectedTimezone />
                    </div>
                </div> -->
            </div>

            <div class="flex flex-col gap-2">
                <Label class="flex items-center gap-2">Is this a weekly recurring event?</Label>
                <RadioGroup.Root bind:value={weeklyRecurrence}>
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
                <Button class="w-full" onclick={handleCreateEvent} disabled={!canCreate}
                    >Create Event</Button
                >
            </div>
        </div>
    </Dialog.Content>
</Dialog.Root>

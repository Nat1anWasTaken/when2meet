<script lang="ts">
    import { refreshAll } from "$app/navigation";
    import { createEvent } from "$lib/api/events.remote";
    import DateAndTimeSelect from "$lib/components/date-and-time-select.svelte";
    import { Button } from "$lib/components/ui/button";
    import * as Dialog from "$lib/components/ui/dialog/";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import * as RadioGroup from "$lib/components/ui/radio-group";
    import { preservedEventNames } from "$lib/utils";
    import type { CalendarDate } from "@internationalized/date";
    import { Time, toCalendarDateTime } from "@internationalized/date";
    import type { Snippet } from "svelte";
    import { toast } from "svelte-sonner";
    import TimezoneSelect from "./timezone-select.svelte";

    type WeeklyRecurrence = "weekly" | "once";

    interface Props {
        children: Snippet;
    }

    let { children } = $props();

    let open = $state<boolean>(false);
    let validationErrorMessage = $state<string | undefined>(undefined);

    let eventName = $state<string>("");
    let organizerName = $state<string>("");
    let weeklyRecurrence = $state<WeeklyRecurrence>("weekly");

    let selectedStartDate = $state<CalendarDate | undefined>(undefined);
    let selectedStartTime = $state<Time | undefined>(new Time(9, 0));

    let selectedEndDate = $state<CalendarDate | undefined>(undefined);
    let selectedEndTime = $state<Time | undefined>(new Time(10, 0));

    let selectedTimezone = $state<string | undefined>(undefined);

    let selectedWeeklyRecurrence = $derived(weeklyRecurrence === "weekly");

    let startingDateTime = $derived(
        selectedStartDate && selectedStartTime
            ? toCalendarDateTime(selectedStartDate, selectedStartTime)
            : undefined
    );

    let endingDateTime = $derived(
        selectedEndDate && selectedEndTime
            ? toCalendarDateTime(selectedEndDate, selectedEndTime)
            : undefined
    );

    const resetForm = () => {
        validationErrorMessage = undefined;

        eventName = "";
        organizerName = "";
        weeklyRecurrence = "weekly";
        selectedStartDate = undefined;
        selectedStartTime = new Time(9, 0);
        selectedEndDate = undefined;
        selectedEndTime = new Time(10, 0);
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

        if (!startingDateTime) {
            missingFields.push("Starting Date and Time");
        }

        if (!endingDateTime) {
            missingFields.push("Ending Date and Time");
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
        validateFormData();

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

            resetForm();
            refreshAll();

            open = false; // Close dialog
        } catch (error) {
            console.error("Failed to create event:", error);
            toast.error("Failed to create event", {
                description: `${error}`
            });
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
                <Label>What date / time might work?</Label>
                <div
                    class="flex w-full flex-col items-start gap-2 md:grid md:grid-cols-3 md:items-center"
                >
                    <p class="text-xs text-muted-foreground">Starting from:</p>
                    <DateAndTimeSelect
                        class="w-full md:col-span-2 md:w-auto"
                        bind:selectedDate={selectedStartDate}
                        bind:selectedTime={selectedStartTime}
                    />
                    <p class="text-xs text-muted-foreground">Ending at:</p>
                    <DateAndTimeSelect
                        class="w-full md:col-span-2 md:w-auto"
                        bind:selectedDate={selectedEndDate}
                        bind:selectedTime={selectedEndTime}
                    />
                    <p class="text-xs text-muted-foreground">Timezone:</p>
                    <TimezoneSelect class="col-span-2 w-full md:w-auto" bind:selectedTimezone />
                </div>
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
                <Button class="w-full" onclick={handleCreateEvent}>Create Event</Button>
            </div>
        </div>
    </Dialog.Content>
</Dialog.Root>

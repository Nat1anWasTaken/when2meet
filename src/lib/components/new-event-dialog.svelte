<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import * as Dialog from "$lib/components/ui/dialog/";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import type { Snippet } from "svelte";
    import DateAndTimeSelect from "$lib/components/date-and-time-select.svelte";
    import type { CalendarDate } from "@internationalized/date";
    import { Time, toCalendarDateTime } from "@internationalized/date";
    import TimezoneSelect from "./timezone-select.svelte";

    interface Props {
        children: Snippet;
    }

    let { children }: Props = $props();

    let selectedStartDate = $state<CalendarDate | undefined>(undefined);
    let selectedStartTime = $state<Time | undefined>(new Time(9, 0));

    let selectedEndDate = $state<CalendarDate | undefined>(undefined);
    let selectedEndTime = $state<Time | undefined>(new Time(10, 0));

    let selectedTimezone = $state<string | undefined>(undefined);

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
</script>

<Dialog.Root>
    <Dialog.Trigger>
        {@render children()}
    </Dialog.Trigger>
    <Dialog.Content>
        <Dialog.Header>
            <Dialog.Title>New Event</Dialog.Title>
            <Dialog.Description>create a new event</Dialog.Description>
        </Dialog.Header>
        <div class="flex flex-col gap-2">
            <Label>What is the event called?</Label>
            <Input placeholder="Event Name" />
        </div>
        <div class="flex flex-col gap-2">
            <Label>Who is the organizer?</Label>
            <Input placeholder="Organizer Name" />
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
        <Button class="mt-2">Create Event</Button>
    </Dialog.Content>
</Dialog.Root>

<script lang="ts">
    import * as Popover from "$lib/components/ui/popover";
    import * as Select from "$lib/components/ui/select";
    import { Button } from "$lib/components/ui/button";
    import { Calendar } from "$lib/components/ui/calendar/";
    import { getLocalTimeZone } from "@internationalized/date";
    import type { CalendarDate } from "@internationalized/date";
    import { ChevronDownIcon } from "lucide-svelte";
    import { listTimesByInterval } from "$lib/utils";

    let id = $props.id();

    let availableTimes = $derived(listTimesByInterval(30));

    let isCalendarOpen = $state(false);
    let calendarDate = $state<CalendarDate | undefined>(undefined);
    let selectedTime = $state<string>("09:00");
</script>

<Popover.Root bind:open={isCalendarOpen}>
    <Popover.Trigger id="{id}-date">
        {#snippet child({ props })}
            <Button {...props} variant="outline" class="justify-between font-normal">
                {calendarDate
                    ? calendarDate.toDate(getLocalTimeZone()).toLocaleDateString()
                    : "Select date"}
                <ChevronDownIcon />
            </Button>
        {/snippet}
    </Popover.Trigger>
    <Popover.Content class="w-auto overflow-hidden p-0" align="start" side="top">
        <Calendar
            type="single"
            bind:value={calendarDate}
            onValueChange={() => {
                isCalendarOpen = false;
            }}
            captionLayout="dropdown"
        />
    </Popover.Content>
</Popover.Root>
<Select.Root type="single" bind:value={selectedTime}>
    <Select.Trigger class="w-full max-w-xl">
        {selectedTime || "09:00"}
    </Select.Trigger>
    <Select.Content side="top" class="overflow-y-auto">
        {#each availableTimes as time}
            <Select.Item value={time}>{time}</Select.Item>
        {/each}
    </Select.Content>
</Select.Root>

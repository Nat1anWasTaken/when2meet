<script lang="ts">
    import * as Popover from "$lib/components/ui/popover";
    import * as Select from "$lib/components/ui/select";
    import { Button } from "$lib/components/ui/button";
    import { Calendar } from "$lib/components/ui/calendar/";
    import { getLocalTimeZone } from "@internationalized/date";
    import type { CalendarDate } from "@internationalized/date";
    import { Time } from "@internationalized/date";
    import { ChevronDownIcon } from "lucide-svelte";
    import { cn, formatTime, listTimesByInterval, parseTime } from "$lib/utils";
    import type { HTMLAttributes } from "svelte/elements";

    interface Props extends HTMLAttributes<HTMLDivElement> {
        selectedDate?: CalendarDate;
        selectedTime?: Time;
    }

    let id = $props.id();
    let {
        class: className = "",
        selectedDate = $bindable(undefined),
        selectedTime = $bindable(new Time(9, 0)),
        ...props
    }: Props = $props();

    let isCalendarOpen = $state(false);

    let availableTimes = $derived(listTimesByInterval(30));
    let selectedTimeString = $derived(formatTime(selectedTime));
</script>

<div class={cn("grid grid-cols-1 gap-2 md:grid-cols-2", className)} {...props}>
    <Popover.Root>
        <Popover.Trigger id="{id}-date">
            {#snippet child({ props })}
                <Button
                    {...props}
                    variant="outline"
                    class={cn(
                        "w-full justify-between font-normal md:w-auto",
                        selectedDate ? "text-foreground" : "text-muted-foreground"
                    )}
                >
                    {selectedDate
                        ? selectedDate.toDate(getLocalTimeZone()).toLocaleDateString()
                        : "Select date"}
                    <ChevronDownIcon />
                </Button>
            {/snippet}
        </Popover.Trigger>
        <Popover.Content class="w-full overflow-hidden p-0 md:w-auto" align="center" side="top">
            <Calendar
                type="single"
                bind:value={selectedDate}
                onValueChange={() => {
                    isCalendarOpen = false;
                }}
                captionLayout="dropdown"
            />
        </Popover.Content>
    </Popover.Root>

    <Select.Root
        type="single"
        onValueChange={(time) => {
            selectedTime = parseTime(time)!;
        }}
    >
        <Select.Trigger
            class={cn(
                "w-full max-w-xl",
                selectedTimeString ? "text-foreground" : "text-muted-foreground"
            )}
        >
            {selectedTime ? selectedTimeString : "9:00"}
        </Select.Trigger>
        <Select.Content side="top" class="overflow-y-auto">
            {#each availableTimes as time}
                <Select.Item value={formatTime(time)}>{formatTime(time)}</Select.Item>
            {/each}
        </Select.Content>
    </Select.Root>
</div>

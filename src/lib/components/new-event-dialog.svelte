<script lang="ts">
    import * as Dialog from "$lib/components/ui/dialog/";
    import type { Snippet } from "svelte";
    import { Button } from "$lib/components/ui/button";
    import { Label } from "$lib/components/ui/label";
    import { Input } from "$lib/components/ui/input";
    import * as Popover from "$lib/components/ui/popover";
    import { Calendar } from "$lib/components/ui/calendar/";
    import { getLocalTimeZone } from "@internationalized/date";
    import type { CalendarDate } from "@internationalized/date";
    import { ChevronDownIcon } from "lucide-svelte";
    import { listTimesByInterval } from "$lib/utils";
    import * as Select from "$lib/components/ui/select";

    interface Props {
        children: Snippet;
    }

    let id = $props.id();
    let { children }: Props = $props();

    let isCalendarOpen = $state(false);
    let calendarDate = $state<CalendarDate | undefined>(undefined);

    let availableTimes = $derived(listTimesByInterval(30));

    let selectedTime = $state<string>("09:00");
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
        <div class="flex flex-col gap-4">
            <div class="flex flex-col gap-2">
                <Label>What is the event called?</Label>
                <Input placeholder="Event Name" />
            </div>
        </div>
        <div class="flex flex-col gap-4">
            <div class="flex flex-col gap-2">
                <Label>Who is the organizer?</Label>
                <Input placeholder="Organizer Name" />
            </div>
        </div>
        <div class="flex flex-col gap-4">
            <div class="flex flex-col gap-2">
                <Label>What date / time might work?</Label>
                <div class="grid w-full grid-cols-3 items-center gap-2">
                    <p class="text-xs text-muted-foreground">Starting from:</p>
                    <Popover.Root bind:open={isCalendarOpen}>
                        <Popover.Trigger id="{id}-date">
                            {#snippet child({ props })}
                                <Button
                                    {...props}
                                    variant="outline"
                                    class="justify-between font-normal"
                                >
                                    {calendarDate
                                        ? calendarDate
                                              .toDate(getLocalTimeZone())
                                              .toLocaleDateString()
                                        : "Select date"}
                                    <ChevronDownIcon />
                                </Button>
                            {/snippet}
                        </Popover.Trigger>
                        <Popover.Content
                            class="w-auto overflow-hidden p-0"
                            align="start"
                            side="top"
                        >
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
                </div>
            </div>
        </div>

        <Button class="mt-2">Create Event</Button>
    </Dialog.Content>
</Dialog.Root>

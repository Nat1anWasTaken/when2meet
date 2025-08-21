<script lang="ts">
    import { getOrganizedEvents, getParticipatedEvents } from "$lib/api/events.remote";
    import EventCard from "$lib/components/event-card.svelte";
    import NewEventDialog from "$lib/components/new-event-dialog.svelte";
    import Button from "$lib/components/ui/button/button.svelte";
    import Input from "$lib/components/ui/input/input.svelte";
    import * as Select from "$lib/components/ui/select";
    import Separator from "$lib/components/ui/separator/separator.svelte";
    import * as Tabs from "$lib/components/ui/tabs/";

    let sort = $state("");
    let searchQuery = $state("");

    let triggerContent = $derived(sort ? sort : "Sort");
</script>

{#snippet eventGallery(events: Awaited<ReturnType<typeof getOrganizedEvents>>)}
    {#each events as event}
        <EventCard weeklyRecurrence={event.weeklyRecurrence}>
            {#snippet name()}
                {event.name}
            {/snippet}
            {#snippet organizer()}
                {event.organizerName}
            {/snippet}
            {#snippet startTime()}
                {new Date(event.availableTime.startTime).toLocaleString()}
            {/snippet}
            {#snippet endTime()}
                {new Date(event.availableTime.endTime).toLocaleString()}
            {/snippet}
            {#snippet timezone()}
                {event.timezone}
            {/snippet}
        </EventCard>
    {/each}
{/snippet}

<div class="flex h-full w-full items-center justify-center p-4">
    <div class="h-full w-full max-w-4xl">
        <h1 class="text-4xl font-bold">Events</h1>
        <p class="text-muted-foreground">all your events in one place</p>

        <Separator class="my-2" />

        <Tabs.Root value="organized-events">
            <Tabs.List class="w-full">
                <Tabs.Trigger value="organized-events">Organized</Tabs.Trigger>
                <Tabs.Trigger value="attending-events">Attending</Tabs.Trigger>
            </Tabs.List>

            <div class="flex flex-row items-center gap-2">
                <Input class="flex-1" placeholder="search" bind:value={searchQuery} />
                <Select.Root type="single" bind:value={sort}>
                    <Select.Trigger class="w-32">{triggerContent}</Select.Trigger>
                    <Select.Content>
                        <Select.Item value="available-time">Available Time</Select.Item>
                        <Select.Item value="name">Name</Select.Item>
                    </Select.Content>
                </Select.Root>
                <NewEventDialog>
                    <Button>New Event</Button>
                </NewEventDialog>
            </div>

            <div class="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2">
                <svelte:boundary>
                    <Tabs.Content value="organized-events">
                        {@render eventGallery(await getOrganizedEvents({ name: searchQuery }))}
                    </Tabs.Content>
                    <Tabs.Content value="attending-events">
                        {@render eventGallery(
                            (await getParticipatedEvents({ name: searchQuery })).map(
                                (entry) => entry.event
                            )
                        )}
                    </Tabs.Content>

                    {#snippet pending()}
                        <p class="text-muted-foreground">Loading events...</p>
                    {/snippet}

                    {#snippet failed(error)}
                        <p class="text-red-500">Error loading events: {error}</p>
                    {/snippet}
                </svelte:boundary>
            </div>
        </Tabs.Root>
        <!--
        <div class="flex flex-row items-center gap-2">
            <Input class="flex-1" placeholder="search" />
            <Select.Root type="single" bind:value={sort}>
                <Select.Trigger class="w-32">{triggerContent}</Select.Trigger>
                        {/await}
                    </Tabs.Content>
                </svelte:boundary>
            </div>
        </Tabs.Root>
        <!--
        <div class="flex flex-row items-center gap-2">
            <Input class="flex-1" placeholder="search" />
            <Select.Root type="single" bind:value={sort}>
                <Select.Trigger class="w-32">{triggerContent}</Select.Trigger>
                <Select.Content>
                    <Select.Item value="available-time">Available Time</Select.Item>
                    <Select.Item value="name">Name</Select.Item>
                </Select.Content>
            </Select.Root>
            <NewEventDialog>
                <Button>New Event</Button>
            </NewEventDialog>
        </div>

        <div class="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2">
            <EventCard weeklyRecurrence={false}>
                {#snippet name()}
                    New Event
                {/snippet}
                {#snippet organizer()}
                    Nathan
                {/snippet}
                {#snippet startTime()}
                    1970/1/1 0:00
                {/snippet}
                {#snippet endTime()}
                    1970/1/1 1:00
                {/snippet}
                {#snippet timezone()}
                    Asia/Taipei
                {/snippet}
            </EventCard><EventCard weeklyRecurrence={false}>
                {#snippet name()}
                    New Event
                {/snippet}
                {#snippet organizer()}
                    Nathan
                {/snippet}
                {#snippet startTime()}
                    1970/1/1 0:00
                {/snippet}
                {#snippet endTime()}
                    1970/1/1 1:00
                {/snippet}
                {#snippet timezone()}
                    Asia/Taipei
                {/snippet}
            </EventCard><EventCard weeklyRecurrence={false}>
                {#snippet name()}
                    New Event
                {/snippet}
                {#snippet organizer()}
                    Nathan
                {/snippet}
                {#snippet startTime()}
                    1970/1/1 0:00
                {/snippet}
                {#snippet endTime()}
                    1970/1/1 1:00
                {/snippet}
                {#snippet timezone()}
                    Asia/Taipei
                {/snippet}
            </EventCard>
        </div> -->
    </div>
</div>

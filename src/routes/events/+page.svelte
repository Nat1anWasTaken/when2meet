<script lang="ts">
    import { goto } from "$app/navigation";
    import { page } from "$app/state";
    import { getOrganizedEvents, getParticipatedEvents } from "$lib/api/events.remote";
    import EventCard from "$lib/components/event-card.svelte";
    import NewEventDialog from "$lib/components/new-event-dialog.svelte";
    import Button from "$lib/components/ui/button/button.svelte";
    import Input from "$lib/components/ui/input/input.svelte";
    import * as Select from "$lib/components/ui/select";
    import Separator from "$lib/components/ui/separator/separator.svelte";
    import * as Tabs from "$lib/components/ui/tabs/";
    import IconUser from "~icons/lucide/user";

    let sort = $state("");
    let searchQuery = $state("");

    const sortLabels = {
        "available-time": "Available Time",
        name: "Name"
    } as const;

    let triggerContent = $derived(sort ? sortLabels[sort as keyof typeof sortLabels] : "Sort");

    function sortEvents(events: Awaited<ReturnType<typeof getOrganizedEvents>>) {
        if (!sort || !events || !Array.isArray(events)) return events;

        return [...events].sort((a, b) => {
            switch (sort) {
                case "available-time":
                    return (
                        new Date(a.availableTime.startTime).getDate() -
                        new Date(b.availableTime.startTime).getDate()
                    );
                case "name":
                    return a.name.localeCompare(b.name);
                default:
                    return 0;
            }
        });
    }

    function handleLogin() {
        const currentUrl = encodeURIComponent(page.url.pathname + page.url.search);
        goto(`/login?redirect_to=${currentUrl}`);
    }
</script>

{#snippet eventGallery(events: Awaited<ReturnType<typeof getOrganizedEvents>>)}
    {#each events as event, index (index)}
        <EventCard
            eventId={event.id}
            name={event.name}
            organizerName={event.organizerName}
            weeklyRecurrence={event.weeklyRecurrence}
            availableTime={{
                startTime: new Date(event.availableTime.startTime),
                endTime: new Date(event.availableTime.endTime)
            }}
            timezone={event.timezone}
        />
    {/each}
{/snippet}

{#snippet unauthorizedView()}
    <div
        class="flex min-h-[400px] w-full flex-col items-center justify-center space-y-6 text-center"
    >
        <div class="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <IconUser class="h-8 w-8 text-muted-foreground" />
        </div>

        <div>
            <h2 class="text-2xl font-semibold">Sign In Required</h2>
            <p class="mt-2 text-muted-foreground">
                You need to be logged in to view your events and create new ones.
            </p>
        </div>
        <Button onclick={handleLogin}>Sign In to Continue</Button>
    </div>
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
                        <Select.Item value="available-time">
                            {sortLabels["available-time"]}
                        </Select.Item>
                        <Select.Item value="name">
                            {sortLabels["name"]}
                        </Select.Item>
                    </Select.Content>
                </Select.Root>
                <NewEventDialog>
                    <Button>New Event</Button>
                </NewEventDialog>
            </div>

            <div class="mt-4">
                <svelte:boundary>
                    <Tabs.Content
                        value="organized-events"
                        class="grid grid-flow-row grid-cols-1 gap-2 md:grid-cols-2"
                    >
                        {#await getOrganizedEvents({ name: searchQuery }) then events}
                            {@render eventGallery(sortEvents(events))}
                        {/await}
                    </Tabs.Content>
                    <Tabs.Content
                        value="attending-events"
                        class="grid grid-flow-row grid-cols-1 gap-2 md:grid-cols-2"
                    >
                        {#await getParticipatedEvents( { name: searchQuery } ).then( (result) => result.map((entry) => entry.event) ) then events}
                            {@render eventGallery(sortEvents(events))}
                        {/await}
                    </Tabs.Content>

                    {#snippet pending()}
                        <div class="flex items-center justify-center py-8">
                            <p class="text-muted-foreground">Loading events...</p>
                        </div>
                    {/snippet}

                    {#snippet failed(error)}
                        {#if error && typeof error === "object" && "status" in error && error.status === 401}
                            {@render unauthorizedView()}
                        {:else}
                            <div class="flex flex-col items-center justify-center py-8 text-center">
                                <h3 class="text-xl font-semibold text-destructive">
                                    Something went wrong
                                </h3>
                                <p class="mt-2 text-muted-foreground">
                                    {error &&
                                    typeof error === "object" &&
                                    "message" in error &&
                                    typeof error.message === "string"
                                        ? error.message
                                        : "An unexpected error occurred"}
                                </p>
                            </div>
                        {/if}
                    {/snippet}
                </svelte:boundary>
            </div>
        </Tabs.Root>
    </div>
</div>

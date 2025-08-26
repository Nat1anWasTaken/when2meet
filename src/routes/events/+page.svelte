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
    import IconCalendarX from "~icons/lucide/calendar-x";
    import IconUser from "~icons/lucide/user";
    import { m } from "$lib/paraglide/messages";

    let sort = $state("");
    let searchQuery = $state("");

    const sortLabels = {
        "available-time": m.events_sort_available_time(),
        name: m.events_sort_name()
    } as const;

    let triggerContent = $derived(sort ? sortLabels[sort as keyof typeof sortLabels] : m.events_sort_placeholder());

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
        class="col-span-full flex min-h-[400px] w-full flex-col items-center justify-center space-y-6 text-center"
    >
        <div class="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <IconUser class="h-8 w-8 text-muted-foreground" />
        </div>

        <div>
            <h2 class="text-2xl font-semibold">{m.events_unauthorized_title()}</h2>
            <p class="mt-2 text-muted-foreground">
                {m.events_unauthorized_description()}
            </p>
        </div>
        <Button onclick={handleLogin}>{m.events_unauthorized_continue()}</Button>
    </div>
{/snippet}

{#snippet emptyView()}
    <div
        class="col-span-full flex min-h-[400px] w-full flex-col items-center justify-center space-y-6 text-center"
    >
        <div class="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <IconCalendarX class="h-8 w-8 text-muted-foreground" />
        </div>

        <div>
            <h2 class="text-2xl font-semibold">{m.events_empty_title()}</h2>
            <p class="mt-2 text-muted-foreground">
                {m.events_empty_description()}
            </p>
        </div>
        <NewEventDialog redirect={false}>
            <Button>{m.events_empty_create_new()}</Button>
        </NewEventDialog>
    </div>
{/snippet}

<div class="flex h-full w-full items-center justify-center p-4">
    <div class="h-full w-full max-w-4xl">
        <h1 class="text-4xl font-bold">{m.events_title()}</h1>
        <p class="text-muted-foreground">{m.events_description()}</p>

        <Separator class="my-2" />

        <Tabs.Root value="organized-events">
            <Tabs.List class="w-full">
                <Tabs.Trigger value="organized-events">{m.events_tab_organized()}</Tabs.Trigger>
                <Tabs.Trigger value="attending-events">{m.events_tab_attending()}</Tabs.Trigger>
            </Tabs.List>

            <div class="flex flex-row items-center gap-2">
                <Input class="flex-1" placeholder={m.events_search_placeholder()} bind:value={searchQuery} />
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
                    <Button>{m.events_create_new()}</Button>
                </NewEventDialog>
            </div>

            <div class="mt-4">
                <svelte:boundary>
                    {#snippet pending()}
                        <div class="col-span-full flex items-center justify-center py-8">
                            <p class="text-muted-foreground">{m.events_loading()}</p>
                        </div>
                    {/snippet}

                    {#snippet failed(error)}
                        {#if error && typeof error === "object" && "status" in error && error.status === 401}
                            {@render unauthorizedView()}
                        {:else}
                            <div
                                class="col-span-full flex flex-col items-center justify-center py-8 text-center"
                            >
                                <h3 class="text-xl font-semibold text-destructive">
                                    {m.events_error_title()}
                                </h3>
                                <p class="mt-2 text-muted-foreground">
                                    {error &&
                                    typeof error === "object" &&
                                    "message" in error &&
                                    typeof error.message === "string"
                                        ? error.message
                                        : m.events_error_description()}
                                </p>
                            </div>
                        {/if}
                    {/snippet}

                    <Tabs.Content
                        value="organized-events"
                        class="grid grid-flow-row grid-cols-1 gap-2 md:grid-cols-2"
                    >
                        {#await getOrganizedEvents({ name: searchQuery })}
                            {@render pending()}
                        {:then events}
                            {#if !events?.length}
                                {@render emptyView()}
                            {:else}
                                {@render eventGallery(sortEvents(events))}
                            {/if}
                        {:catch error}
                            {@render failed(error)}
                        {/await}
                    </Tabs.Content>
                    <Tabs.Content
                        value="attending-events"
                        class="grid grid-flow-row grid-cols-1 gap-2 md:grid-cols-2"
                    >
                        {#await getParticipatedEvents( { name: searchQuery } ).then( (result) => result.map((entry) => entry.event) )}
                            {@render pending()}
                        {:then events}
                            {#if !events?.length}
                                {@render emptyView()}
                            {:else}
                                {@render eventGallery(sortEvents(events))}
                            {/if}
                        {:catch error}
                            {@render failed(error)}
                        {/await}
                    </Tabs.Content>
                </svelte:boundary>
            </div>
        </Tabs.Root>
    </div>
</div>

<script lang="ts">
    import { page } from "$app/state";
    import ColorMapDisplay from "$lib/components/color-map-display.svelte";
    import EventCard from "$lib/components/event-card.svelte";
    import ParticipantBadge from "$lib/components/participant-badge.svelte";
    import ParticipationControlBar from "$lib/components/participation-control-bar.svelte";
    import TimeSelector from "$lib/components/time-selector.svelte";
    import { Button } from "$lib/components/ui/button";
    import * as Card from "$lib/components/ui/card";
    import { extractPrimaryHue, generateAvailabilityColorMap } from "$lib/utils";
    import type { PageProps } from "./$types";

    let { data }: PageProps = $props();

    let totalParticipants = $derived(data.participants?.length || 0);

    let availabilityColorMap = $derived.by(() => {
        if (totalParticipants === 0) {
            return generateAvailabilityColorMap(0);
        }

        const primaryHue = extractPrimaryHue() || 277;
        return generateAvailabilityColorMap(totalParticipants, primaryHue);
    });

    // Meta tag data
    let eventUrl = $derived(page.url.toString());
    let eventTitle = $derived(`${data.name} - when2meet.app`);
    let eventDescription = $derived(
        `Join "${data.name}" organized by ${data.organizerName}. ${totalParticipants} ${totalParticipants === 1 ? "person has" : "people have"} already joined. Find times that work for everyone!`
    );

    // State management
    let participationMode = $state<"view" | "participate">("view");
    let selectedTimes = $state<{ startTime: Date; endTime: Date }[]>([]);
    let selectorSelectable = $state(false);
    let controlBarRef = $state<{ focusInput?: () => void }>({});

    function startParticipation() {
        participationMode = "participate";
        selectorSelectable = true;
        setTimeout(() => {
            controlBarRef?.focusInput?.();
        }, 100);
    }

    function reset() {
        participationMode = "view";
        selectedTimes = [];
        selectorSelectable = false;
    }
</script>

<svelte:head>
    <title>{data.name} - when2meet.app</title>
    <meta name="description" content={eventDescription} />

    <!-- OpenGraph meta tags -->
    <meta property="og:type" content="website" />
    <meta property="og:title" content={eventTitle} />
    <meta property="og:description" content={eventDescription} />
    <meta property="og:url" content={eventUrl} />
    <meta property="og:site_name" content="when2meet.app" />
    <meta property="og:locale" content="en_US" />

    <!-- Twitter Card meta tags -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content={eventTitle} />
    <meta name="twitter:description" content={eventDescription} />
    <meta name="twitter:url" content={eventUrl} />
    <meta name="twitter:site" content="@when2meetapp" />

    <!-- Additional meta tags -->
    <meta name="author" content={data.organizerName} />
    <meta name="robots" content="index, follow" />
</svelte:head>

<div class="flex h-full w-full items-start justify-center p-4">
    <div class="flex h-full w-full max-w-4xl flex-col gap-6">
        <!-- Event Header -->
        <EventCard
            eventId={data.id}
            name={data.name}
            organizerName={data.organizerName}
            weeklyRecurrence={data.weeklyRecurrence}
            availableTime={data.availableTime}
            timezone={data.timezone}
            showActions={false}
            class="w-full"
        />

        <!-- Participation Section -->
        <Card.Root class="w-full">
            <Card.Header>
                <Card.Title>Participants ({totalParticipants})</Card.Title>
                <Card.Description>
                    {#if totalParticipants > 0}
                        People who have joined this event and selected their available times.
                    {:else}
                        No one has joined this event yet.
                    {/if}
                </Card.Description>
            </Card.Header>
            <Card.Content>
                {#if data.participants && data.participants.length > 0}
                    <div class="mb-4 flex flex-wrap gap-2">
                        {#each data.participants as participant (participant.id)}
                            <ParticipantBadge
                                name={participant.username ||
                                    participant.user?.name ||
                                    "Unknown User"}
                                image={participant.user?.image}
                            />
                        {/each}
                    </div>
                {/if}
                <Button
                    size="lg"
                    onclick={startParticipation}
                    disabled={participationMode === "participate"}>Participate in Event</Button
                >
            </Card.Content>
        </Card.Root>

        <!-- Time Selection -->
        {#if data?.availableTime}
            <Card.Root class="w-full flex-1">
                <Card.Header>
                    <Card.Title>
                        {#if participationMode === "view"}
                            Available Time Range
                        {:else}
                            Select Your Available Times
                        {/if}
                    </Card.Title>
                    <Card.Description>
                        {#if participationMode === "view"}
                            This event is scheduled within the time range shown below.
                        {:else}
                            Click and drag to select the times when you're available.
                        {/if}
                    </Card.Description>
                </Card.Header>
                <Card.Content class="p-6">
                    <div class="mb-4">
                        <ColorMapDisplay {availabilityColorMap} {totalParticipants} />
                    </div>
                    <TimeSelector
                        startDate={data.availableTime.startTime}
                        endDate={data.availableTime.endTime}
                        intervalInMinutes={60}
                        cellHeight="40px"
                        class="w-full overflow-auto"
                        bind:selectable={selectorSelectable}
                        bind:selectedTimes
                        participants={data.participants}
                        {availabilityColorMap}
                    />
                </Card.Content>
            </Card.Root>
        {/if}
    </div>
</div>

<!-- Floating Control Bar -->
{#if participationMode === "participate"}
    <ParticipationControlBar
        bind:this={controlBarRef}
        eventId={data.id}
        {selectedTimes}
        onSuccess={reset}
        onCancel={reset}
    />
{/if}

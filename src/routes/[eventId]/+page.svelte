<script lang="ts">
    import ColorMapDisplay from "$lib/components/color-map-display.svelte";
    import EventCard from "$lib/components/event-card.svelte";
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

    let participationMode = $state<"view" | "participate">("view");
    let selectedTimes = $state<{ startTime: Date; endTime: Date }[]>([]);
    let selectorSelectable = $state(false);

    function startParticipation() {
        participationMode = "participate";
        selectorSelectable = true;
    }

    function reset() {
        participationMode = "view";
        selectedTimes = [];
        selectorSelectable = false;
    }
</script>

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
        {#if participationMode === "view"}
            <Card.Root class="w-full">
                <Card.Header>
                    <Card.Title>Participate in this Event</Card.Title>
                    <Card.Description>
                        Join this event by selecting your available times.
                    </Card.Description>
                </Card.Header>
                <Card.Content class="p-6">
                    <Button size="lg" onclick={startParticipation}>Participate in Event</Button>
                </Card.Content>
            </Card.Root>
        {/if}

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
    <ParticipationControlBar eventId={data.id} {selectedTimes} onSuccess={reset} onCancel={reset} />
{/if}

<script lang="ts">
    import EventCard from "$lib/components/event-card.svelte";
    import TimeSelector from "$lib/components/time-selector.svelte";
    import * as Card from "$lib/components/ui/card";
    import { daysBetween } from "$lib/utils";
    import type { PageProps } from "./$types";

    let { data }: PageProps = $props();

    let selectedTimes = $state<{ startTime: Date; endTime: Date }[]>([]);
</script>

<div class="flex h-full w-full items-start justify-center p-4">
    <div class="flex h-full w-full max-w-6xl flex-col gap-6">
        <!-- Event Header -->
        <EventCard
            eventId={data.id}
            name={data.name}
            organizerName={data.organizerName}
            weeklyRecurrence={data.weeklyRecurrence}
            availableTime={data.availableTime}
            timezone={data.timezone}
            showActions={false}
            informationMode="expanded"
            class="w-full"
        />

        <!-- Time Selection -->
        {#if data?.availableTime}
            <Card.Root class="w-full flex-1">
                <Card.Header>
                    <Card.Title>Select Your Available Times</Card.Title>
                    <Card.Description>
                        Click and drag to select the times when you're available. Your selections
                        will be saved automatically.
                    </Card.Description>
                </Card.Header>
                <Card.Content class="p-6">
                    <TimeSelector
                        startDate={data.availableTime.startTime}
                        endDate={data.availableTime.endTime}
                        intervalInMinutes={60}
                        cellHeight="40px"
                        class="w-full overflow-auto"
                    />
                </Card.Content>
            </Card.Root>
        {/if}
    </div>
</div>

<script lang="ts">
    import { goto } from "$app/navigation";
    import { page } from "$app/state";
    import { authClient } from "$lib/auth-client";
    import ColorMapDisplay from "$lib/components/color-map-display.svelte";
    import EventCard from "$lib/components/event-card.svelte";
    import InvitationDialog from "$lib/components/invitation-dialog.svelte";
    import ParticipantBadge from "$lib/components/participant-badge.svelte";
    import ParticipationControlBar from "$lib/components/participation-control-bar.svelte";
    import TimeSelector from "$lib/components/time-selector.svelte";
    import { Button } from "$lib/components/ui/button";
    import * as Card from "$lib/components/ui/card";
    import {
        cellsToTimeSelections,
        extractPrimaryHue,
        generateAvailabilityColorMap,
        generateDaysArray,
        timeSelectionsToCells,
        type Cell
    } from "$lib/utils";
    import { backOut } from "svelte/easing";
    import { slide } from "svelte/transition";
    import IconArrowDown from "~icons/lucide/arrow-down";
    import type { PageProps } from "./$types";

    let { data }: PageProps = $props();

    const session = authClient.useSession();

    let currentUserId = $derived($session.data?.user?.id);

    let userAlreadyJoined = $derived.by(() => {
        if (!currentUserId) return false;
        return data.participants?.some((p) => p.userId === currentUserId) || false;
    });

    let currentUserParticipant = $derived.by(() => {
        if (!currentUserId) return null;
        return data.participants?.find((p) => p.userId === currentUserId) || null;
    });

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

    let days = $derived(
        data?.availableTime
            ? generateDaysArray(data.availableTime.startTime, data.availableTime.endTime)
            : []
    );

    let timeSelectorRef = $state<TimeSelector | null>(null);
    // State management
    let participationMode = $state<"view" | "participate">("view");
    let selectedCells = $state<Cell[]>([]);
    let selectedTimes = $derived(cellsToTimeSelections(selectedCells, days, 60));
    let selectorSelectable = $state(false);
    let controlBarRef = $state<{ focusInput?: () => void }>({});

    let participated = $state<boolean>(false);
    let canJoin = $derived((currentUserId || !participated) && participationMode == "view");

    // Invitation dialog state
    let isInvited = $derived(page.url.searchParams.get("invited") === "true");
    let invitationDialogOpen = $state(false);

    $effect(() => {
        const invited = page.url.searchParams.get("invited") === "true";
        const hasUserId = !!currentUserId;
        const alreadyJoined =
            hasUserId && data.participants?.some((p) => p.userId === currentUserId);

        if (invited && !alreadyJoined) {
            invitationDialogOpen = true;
        }
    });

    function acceptInvitation() {
        startParticipation();
    }

    function cancelInvitation() {
        let url = page.url;
        url.searchParams.delete("invited");
        goto(url);
    }

    function startParticipation() {
        participationMode = "participate";
        selectorSelectable = true;

        // If user is already joined, pre-populate their existing selections
        if (currentUserParticipant && currentUserParticipant.timeSelection) {
            selectedCells = timeSelectionsToCells(currentUserParticipant.timeSelection, days, 60);
        }

        setTimeout(() => {
            controlBarRef?.focusInput?.();
        }, 100);
    }

    function reset() {
        participationMode = "view";
        selectorSelectable = false;
        selectedCells = [];
        timeSelectorRef?.resetSelection?.();
    }

    function handleSuccess() {
        participated = true;
        reset();
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

<div class="flex w-full items-start justify-center p-4">
    <div class="flex w-full max-w-4xl flex-col gap-6">
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
            </Card.Content>
        </Card.Root>

        <!-- Join Event -->
        <Card.Root>
            <Card.Header>
                <Card.Title>Want to join <span class="font-semibold">{data.name}</span>?</Card.Title
                >
                <Card.Description>
                    Join this event and select your available times below.
                </Card.Description>
            </Card.Header>
            <Card.Content>
                <Button
                    size="lg"
                    class="h-16 w-full text-xl"
                    onclick={startParticipation}
                    disabled={!canJoin}
                >
                    {#if participationMode === "view"}
                        {userAlreadyJoined
                            ? "Edit Participation"
                            : participated
                              ? "You have joined"
                              : "Join Event"}
                    {:else if participationMode === "participate"}
                        Select your available time below <IconArrowDown />
                    {/if}
                </Button>
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
                        bind:this={timeSelectorRef}
                        startDate={data.availableTime.startTime}
                        endDate={data.availableTime.endTime}
                        showDates={!data.weeklyRecurrence}
                        intervalInMinutes={60}
                        cellHeight="40px"
                        class="w-full overflow-auto"
                        bind:selectable={selectorSelectable}
                        bind:selectedCells
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
    <div
        class="h-32"
        in:slide={{ duration: 500, easing: backOut }}
        out:slide={{ duration: 300 }}
    ></div>
    <ParticipationControlBar
        bind:this={controlBarRef}
        eventId={data.id}
        {selectedTimes}
        existingParticipant={currentUserParticipant}
        onSuccess={handleSuccess}
        onCancel={reset}
    />
{/if}

<!-- Invitation Dialog -->
{#if isInvited}
    <InvitationDialog
        bind:open={invitationDialogOpen}
        eventName={data.name}
        onAccept={acceptInvitation}
        onDecline={cancelInvitation}
    />
{/if}

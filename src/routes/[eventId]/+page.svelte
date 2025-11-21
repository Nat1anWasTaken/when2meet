<script lang="ts">
    import { goto, invalidateAll } from "$app/navigation";
    import { page } from "$app/state";
    import { authClient } from "$lib/auth-client";
    import ColorMapDisplay from "$lib/components/color-map-display.svelte";
    import EventCard from "$lib/components/event-card.svelte";
    import InvitationDialog from "$lib/components/invitation-dialog.svelte";
    import ParticipantBadge from "$lib/components/participant-badge.svelte";
    import ParticipationControlBar from "$lib/components/participation-control-bar.svelte";
    import TimeSelector from "$lib/components/time-selector.svelte";
    import { Button } from "$lib/components/ui/button";
    import { m } from "$lib/paraglide/messages";
    import * as Card from "$lib/components/ui/card";
    import { localizeUrl } from "$lib/paraglide/runtime";
    import {
        cellsToTimeSelections,
        decodeCells,
        extractPrimaryHue,
        generateAvailabilityColorMap,
        generateDaysArray,
        timeSelectionsToCells,
        type Cell
    } from "$lib/utils";
    import { mode as colorModeStore } from "mode-watcher";
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

    let colorMode: "light" | "dark" = $derived(
        colorModeStore.current === "dark" ? "dark" : "light"
    );

    let availabilityColorMap = $derived.by(() => {
        const currentMode = colorMode;

        if (totalParticipants === 0) {
            return generateAvailabilityColorMap(0, 277, currentMode);
        }

        const primaryHue = extractPrimaryHue() || 277;
        return generateAvailabilityColorMap(totalParticipants, primaryHue, currentMode);
    });

    // Meta tag data
    let eventUrl = $derived(page.url.toString());
    let eventTitle = $derived(`${data.name} - when2meet.app`);
    let eventDescription = $derived(
        totalParticipants === 1
            ? m.event_details_meta_description_singular({
                  eventName: data.name,
                  organizerName: data.organizerName,
                  participantCount: totalParticipants
              })
            : m.event_details_meta_description_plural({
                  eventName: data.name,
                  organizerName: data.organizerName,
                  participantCount: totalParticipants
              })
    );
    let ogImageUrl = $derived(`${page.url.origin}/${data.id}/og`);

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

    // Restore selections after login
    $effect(() => {
        const selectionsParam = page.url.searchParams.get("selections");
        if (!selectionsParam) return;

        const hasSession = !!$session.data;
        if (!hasSession) return;

        const alreadyParticipated = currentUserParticipant !== null;
        if (alreadyParticipated || participationMode !== "view") return;

        const decoded = decodeCells(selectionsParam);
        if (!decoded || decoded.length === 0) return;

        // Validate cells against current days array
        const validCells = decoded.filter(
            ([day, row]) => day >= 0 && day < days.length && row >= 0 && row < 24
        );
        if (validCells.length === 0) return;

        // Restore state
        selectedCells = validCells;
        participationMode = "participate";
        selectorSelectable = true;

        // Clean URL by removing the selections parameter
        const url = new URL(page.url);
        url.searchParams.delete("selections");
        goto(localizeUrl(url), { replaceState: true, noScroll: true });

        // Focus input after a short delay
        setTimeout(() => {
            controlBarRef?.focusInput?.();
        }, 100);
    });

    function acceptInvitation() {
        startParticipation();
    }

    function cancelInvitation() {
        let url = page.url;
        url.searchParams.delete("invited");
        goto(localizeUrl(url));
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

    async function handleSuccess() {
        participated = true;
        reset();
        await invalidateAll();
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
    <meta property="og:image" content={ogImageUrl} />
    <meta property="og:image:width" content="1024" />
    <meta property="og:image:height" content="512" />
    <meta property="og:image:type" content="image/png" />

    <!-- Twitter Card meta tags -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content={eventTitle} />
    <meta name="twitter:description" content={eventDescription} />
    <meta name="twitter:url" content={eventUrl} />
    <meta name="twitter:site" content="@when2meetapp" />
    <meta name="twitter:image" content={ogImageUrl} />

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
                <Card.Title
                    >{m.event_details_participant_list_title({
                        totalParticipants: totalParticipants
                    })}</Card.Title
                >
                <Card.Description>
                    {#if totalParticipants > 0}
                        {m.event_details_participant_list_description()}
                    {:else}
                        {m.event_details_participant_list_empty()}
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
                                    m.unknown_user()}
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
                <Card.Title>
                    {m.event_details_join_title({
                        eventName: data.name
                    })}
                </Card.Title>
                <Card.Description>
                    {m.event_details_join_description()}
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
                            ? m.event_details_edit_participation()
                            : participated
                              ? m.event_details_joined()
                              : m.event_details_join_event()}
                    {:else if participationMode === "participate"}
                        {m.event_details_select_time_instruction()} <IconArrowDown />
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
                            {m.event_details_time_selection_title_viewing()}
                        {:else}
                            {m.event_details_time_selection_title_participating()}
                        {/if}
                    </Card.Title>
                    <Card.Description>
                        {#if participationMode === "view"}
                            {m.event_details_time_selection_description_viewing()}
                        {:else}
                            {m.event_details_time_selection_description_participating()}
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
        {selectedCells}
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

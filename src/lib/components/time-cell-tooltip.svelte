<script lang="ts">
    import { m } from "$i18n";
    import ParticipantBadge from "$lib/components/participant-badge.svelte";
    import { Tooltip as TooltipPrimitive } from "bits-ui";
    import { cubicOut } from "svelte/easing";
    import { fade, fly } from "svelte/transition";

    interface Participant {
        id: number;
        username: string;
        user?: {
            image?: string | null;
        } | null;
    }

    interface Props {
        id: string;
        open?: boolean;
        anchor: HTMLElement | null;
        participantCount: number;
        totalParticipants: number;
        availableParticipants: Participant[];
    }

    let {
        id,
        open = $bindable(false),
        anchor,
        participantCount,
        totalParticipants,
        availableParticipants
    }: Props = $props();
</script>

<TooltipPrimitive.Provider delayDuration={0} disableHoverableContent={true}>
    <TooltipPrimitive.Root bind:open delayDuration={0} disableHoverableContent={true}>
        <TooltipPrimitive.Portal>
            <TooltipPrimitive.Content
                {id}
                customAnchor={anchor}
                side="top"
                sideOffset={8}
                forceMount
            >
                {#snippet child({ props, wrapperProps, open: contentOpen })}
                    <div
                        {...wrapperProps}
                        class="availability-tooltip-wrapper"
                        data-availability-tooltip-wrapper
                    >
                        {#if contentOpen}
                            <div
                                {...props}
                                class="availability-tooltip z-50 w-fit max-w-xs origin-(--bits-tooltip-content-transform-origin) rounded-md bg-muted px-3 py-1.5 text-xs text-balance text-foreground shadow-md"
                                data-availability-tooltip
                                transition:fade={{ duration: 120 }}
                            >
                                <div class="flex flex-col gap-2">
                                    <p class="text-sm">
                                        <span class="inline-grid">
                                            {#key participantCount}
                                                <span
                                                    class="col-start-1 row-start-1"
                                                    in:fade={{ duration: 100 }}
                                                    out:fade={{ duration: 100 }}
                                                >
                                                    {participantCount}
                                                </span>
                                            {/key}
                                        </span>
                                        /{totalParticipants}
                                        {m.time_cell_tooltip_available()}
                                    </p>

                                    {#if availableParticipants.length > 0}
                                        <div class="flex flex-row flex-wrap gap-2">
                                            {#each availableParticipants as participant (participant.id)}
                                                <div class="availability-participant">
                                                    <div
                                                        class="availability-participant-transition"
                                                        in:fly={{
                                                            x: 16,
                                                            duration: 160,
                                                            easing: cubicOut
                                                        }}
                                                        out:fly={{
                                                            x: 16,
                                                            duration: 140,
                                                            easing: cubicOut
                                                        }}
                                                    >
                                                        <ParticipantBadge
                                                            name={participant.username}
                                                            image={participant.user?.image}
                                                            size="sm"
                                                            class="border-1 border-accent"
                                                        />
                                                    </div>
                                                </div>
                                            {/each}
                                        </div>
                                    {/if}
                                </div>

                                <TooltipPrimitive.Arrow>
                                    {#snippet child({ props: arrowProps })}
                                        <div
                                            {...arrowProps}
                                            class="z-50 size-2.5 rotate-45 rounded-[2px] bg-muted"
                                        ></div>
                                    {/snippet}
                                </TooltipPrimitive.Arrow>
                            </div>
                        {/if}
                    </div>
                {/snippet}
            </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
</TooltipPrimitive.Provider>

<style>
    :global(.availability-tooltip-wrapper) {
        transition: transform 180ms cubic-bezier(0.22, 1, 0.36, 1);
        will-change: transform;
    }

    @media (prefers-reduced-motion: reduce) {
        :global(.availability-tooltip-wrapper) {
            transition: none;
        }

        :global(.availability-tooltip),
        :global(.availability-participant),
        :global(.availability-participant-transition) {
            animation-duration: 0.01ms !important;
            transition-duration: 0.01ms !important;
        }
    }
</style>

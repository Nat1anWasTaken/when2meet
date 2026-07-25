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

    let movementReady = $state(false);
    let tooltipWidth = $state<number | null>(null);
    let tooltipHeight = $state<number | null>(null);

    function measureTooltip(node: HTMLElement) {
        let frame: number | null = null;

        const updateSize = () => {
            if (frame !== null) cancelAnimationFrame(frame);

            frame = requestAnimationFrame(() => {
                const { width, height } = node.getBoundingClientRect();
                tooltipWidth = width;
                tooltipHeight = height;
                frame = null;
            });
        };

        const observer = new ResizeObserver(updateSize);
        observer.observe(node);
        updateSize();

        return {
            destroy() {
                observer.disconnect();
                if (frame !== null) cancelAnimationFrame(frame);
            }
        };
    }

    $effect(() => {
        if (!open) {
            movementReady = false;
            tooltipWidth = null;
            tooltipHeight = null;
            return;
        }

        let secondFrame: number | undefined;
        const firstFrame = requestAnimationFrame(() => {
            secondFrame = requestAnimationFrame(() => {
                movementReady = true;
            });
        });

        return () => {
            cancelAnimationFrame(firstFrame);
            if (secondFrame !== undefined) cancelAnimationFrame(secondFrame);
        };
    });
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
                        class:availability-tooltip-wrapper--moving={movementReady}
                        data-availability-tooltip-wrapper
                    >
                        {#if contentOpen}
                            <div
                                {...props}
                                class="availability-tooltip z-50 origin-(--bits-tooltip-content-transform-origin) text-xs text-balance text-foreground"
                                data-availability-tooltip
                                transition:fade={{ duration: 180, easing: cubicOut }}
                            >
                                <div
                                    class="availability-tooltip-shell overflow-hidden rounded-md bg-muted shadow-md"
                                    style:width={tooltipWidth === null
                                        ? undefined
                                        : `${tooltipWidth}px`}
                                    style:height={tooltipHeight === null
                                        ? undefined
                                        : `${tooltipHeight}px`}
                                >
                                    <div
                                        use:measureTooltip
                                        class="flex w-max max-w-xs flex-col gap-2 px-3 py-1.5"
                                    >
                                        <p class="text-sm">
                                            <span class="inline-grid">
                                                {#key participantCount}
                                                    <span
                                                        class="col-start-1 row-start-1"
                                                        in:fade={{ duration: 160 }}
                                                        out:fade={{ duration: 120 }}
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
                                                    <div
                                                        class="availability-participant"
                                                        in:fly={{
                                                            x: 8,
                                                            duration: 220,
                                                            easing: cubicOut
                                                        }}
                                                    >
                                                        <div
                                                            class="availability-participant-transition"
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
        pointer-events: none;
        will-change: transform;
    }

    /* Bits UI sets pointer-events: auto on tooltip content inline. Keep the
       availability popup transparent to hit-testing so pointer movement still
       resolves to the time cells beneath it. */
    :global(.availability-tooltip) {
        pointer-events: none !important;
    }

    :global(.availability-tooltip-wrapper--moving) {
        transition: transform 190ms cubic-bezier(0.32, 0.72, 0, 1);
    }

    :global(.availability-tooltip-shell) {
        transition:
            width 220ms cubic-bezier(0.32, 0.72, 0, 1),
            height 220ms cubic-bezier(0.32, 0.72, 0, 1);
        will-change: width, height;
    }

    @media (prefers-reduced-motion: reduce) {
        :global(.availability-tooltip-wrapper--moving),
        :global(.availability-tooltip-shell) {
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

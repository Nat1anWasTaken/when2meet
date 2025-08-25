<script lang="ts">
    import * as Tooltip from "$lib/components/ui/tooltip";
    import { cn, type Cell } from "$lib/utils";
    import LucideCheck from "~icons/lucide/check";
    import ParticipantBadge from "./participant-badge.svelte";

    interface Props {
        cell: Cell;
        selecting: boolean;
        selected: boolean;
        participantCount: number;
        totalParticipants: number;
        availableParticipants: {
            username: string;
            timeSelection: { startTime: Date; endTime: Date }[];
            user?: {
                image?: string;
            };
        }[];
        cellColor: string;
        selectable?: boolean;
        class?: string;
    }

    let {
        cell,
        selecting,
        selected,
        participantCount,
        totalParticipants,
        availableParticipants,
        cellColor,
        selectable = false,
        class: className
    }: Props = $props();

    function getCellClasses() {
        const baseClasses =
            "cell flex h-full w-full items-center justify-center transition-all duration-150 select-none truncate touch-none";

        if (selecting) {
            return cn(baseClasses, "scale-105 border-2 border-primary shadow-md", className);
        }

        if (selected) {
            return cn(
                baseClasses,
                "border-2 border-primary/70",
                selectable && "animate-float",
                className
            );
        }

        if (selectable) {
            return cn(
                baseClasses,
                "border border-accent hover:border-primary hover:scale-110 animate-float",
                className
            );
        }

        return cn(baseClasses, "border-1 border-accent", className);
    }

    function getCellStyle() {
        if (selecting) {
            return "background-color: hsl(var(--primary) / 0.8)";
        }

        if (selected) {
            return "background-color: hsl(var(--primary) / 0.4)";
        }

        return `background-color: ${cellColor}`;
    }
</script>

<Tooltip.Provider>
    <Tooltip.Root delayDuration={0} disabled={selectable}>
        <Tooltip.Trigger
            data-x={cell[0]}
            data-y={cell[1]}
            class={getCellClasses()}
            style={getCellStyle()}
        >
            {#if selected}
                <LucideCheck />
            {/if}
        </Tooltip.Trigger>

        {#if availableParticipants.length > 0}
            <Tooltip.Content class="max-w-xs">
                <div class="flex flex-col gap-2">
                    <p class="text-sm">
                        {participantCount}/{totalParticipants} available
                    </p>
                    <div class="flex flex-row flex-wrap gap-2">
                        {#each availableParticipants as participant (participant.username)}
                            <ParticipantBadge
                                name={participant.username}
                                image={participant.user?.image}
                                size="sm"
                                class="border-1 border-accent"
                            />
                        {/each}
                    </div>
                </div>
            </Tooltip.Content>
        {/if}
    </Tooltip.Root>
</Tooltip.Provider>

<style>
    @keyframes float {
        0%,
        100% {
            transform: translateY(0) scale(1);
        }
        50% {
            transform: translateY(-2px) scale(1.02);
        }
    }

    :global(.animate-float) {
        animation: float 1.5s ease-in-out infinite;
    }
</style>

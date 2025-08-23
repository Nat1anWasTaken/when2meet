<script lang="ts">
    import * as Tooltip from "$lib/components/ui/tooltip";
    import { cn, type Cell } from "$lib/utils";
    import { Badge } from "./ui/badge";

    interface Props {
        cell: Cell;
        selecting: boolean;
        selected: boolean;
        participantCount: number;
        totalParticipants: number;
        availableParticipants: string[];
        cellColor: string;
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
        class: className
    }: Props = $props();
</script>

<Tooltip.Provider>
    <Tooltip.Root delayDuration={0}>
        <Tooltip.Trigger
            data-x={cell[0]}
            data-y={cell[1]}
            class={cn(
                "cell flex h-full w-full items-center justify-center transition-all duration-150 select-none",
                selecting
                    ? "scale-105 border-2 border-primary shadow-md"
                    : selected
                      ? "border-2 border-primary/70"
                      : "border border-transparent hover:border-primary",
                className
            )}
            style={selecting
                ? "background-color: hsl(var(--primary) / 0.8)"
                : selected
                  ? "background-color: hsl(var(--primary) / 0.4)"
                  : `background-color: ${cellColor}`}
        >
            {#if selected}
                Selected
            {/if}
        </Tooltip.Trigger>

        {#if availableParticipants.length > 0}
            <Tooltip.Content class="max-w-xs">
                <div class="flex flex-col">
                    <p class="text-sm">
                        {participantCount}/{totalParticipants} available
                    </p>
                    <p class="text-center text-wrap text-muted-foreground">
                        {availableParticipants.join(", ")}
                    </p>
                </div>
            </Tooltip.Content>
        {/if}
    </Tooltip.Root>
</Tooltip.Provider>

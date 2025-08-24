<script lang="ts">
    import type { AvailabilityColorMap } from "$lib/utils";

    let {
        availabilityColorMap,
        totalParticipants
    }: { availabilityColorMap: AvailabilityColorMap; totalParticipants: number } = $props();

    // Create array of colors for discrete segments
    let colorSegments = $derived.by(() => {
        const segments: { color: string; count: number }[] = [];

        for (let i = 0; i <= totalParticipants; i++) {
            const color = availabilityColorMap.get(i) || "oklch(var(--accent))";
            segments.push({ color, count: i });
        }

        return segments;
    });
</script>

<div class="flex items-center justify-between gap-4">
    <span class="text-sm text-muted-foreground">0/{totalParticipants} Available</span>
    <div class="flex h-6 flex-1 overflow-hidden rounded-full border border-accent shadow-sm">
        {#each colorSegments as segment (segment.count)}
            <div class="flex-1" style="background-color: {segment.color}"></div>
        {/each}
    </div>
    <span class="text-sm text-muted-foreground"
        >{totalParticipants}/{totalParticipants} Available</span
    >
</div>
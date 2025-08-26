<script lang="ts">
    import type { AvailabilityColorMap } from "$lib/utils";
    import { m } from "$i18n";

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
    <span class="text-sm text-muted-foreground"
        >{m.color_map_available_count({ count: 0, total: totalParticipants })}</span
    >
    <div class="flex h-6 flex-1 overflow-hidden rounded-full border border-accent shadow-sm">
        {#each colorSegments as segment (segment.count)}
            <div class="flex-1" style="background-color: {segment.color}"></div>
        {/each}
    </div>
    <span class="text-sm text-muted-foreground"
        >{m.color_map_available_count({ count: totalParticipants, total: totalParticipants })}</span
    >
</div>

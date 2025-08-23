<script lang="ts">
    import TimeCell from "$lib/components/time-cell.svelte";
    import {
        cellsToTimeSelections,
        cn,
        generateTimeStrings,
        getDayString,
        rectCellsArray,
        type AvailabilityColorMap,
        type Cell
    } from "$lib/utils";

    interface Props {
        class?: string;
        startDate: Date;
        endDate: Date;
        intervalInMinutes?: number;
        cellHeight?: string;
        selectable?: boolean;
        hoveredCell?: Cell | null;
        selectedTimes?: { startTime: Date; endTime: Date }[];
        participants?: Array<{
            username: string;
            timeSelection: { startTime: Date; endTime: Date }[];
        }>;
        availabilityColorMap?: AvailabilityColorMap;
    }

    let {
        class: className,
        startDate,
        endDate,
        intervalInMinutes = 30,
        cellHeight = "1fr",
        selectable = $bindable(false),
        hoveredCell = $bindable(null),
        selectedTimes = $bindable([]),
        participants = [],
        availabilityColorMap
    }: Props = $props();

    let days = $derived.by(() => {
        const dates: Date[] = [];
        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            dates.push(new Date(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
        }
        return dates;
    });

    let cellsPerDay = $derived((60 * 24) / intervalInMinutes);

    let timeGrid: HTMLElement;

    // Select related states
    let mode = $state<"add" | "remove" | null>(null);
    let isSelecting = $state<boolean>(false);
    let lastHovered = $state<Cell | null>(null);
    let startCell = $state<Cell | null>(null);
    let endCell = $state<Cell | null>(null);
    let currentSelectedCells = $derived(
        startCell && endCell ? rectCellsArray(startCell, endCell) : []
    );

    let selectedCells = $state<Cell[]>([]);

    function cellKeyFromCoords(x: number, y: number): string {
        return `${x},${y}`;
    }

    // Calculate participant availability for each cell
    let participantAvailability = $derived.by(() => {
        const totalParticipants = participants?.length || 0;
        if (totalParticipants === 0)
            return new Map<string, { count: number; participants: typeof participants }>();

        const availability = new Map<
            string,
            { count: number; participants: typeof participants }
        >();

        // Count availability for each cell and track full participant objects
        participants.forEach((participant) => {
            participant.timeSelection.forEach((selection) => {
                const startTime = new Date(selection.startTime);
                const endTime = new Date(selection.endTime);

                // Find which day this selection belongs to
                const dayIndex = days.findIndex(
                    (day) =>
                        day.getFullYear() === startTime.getFullYear() &&
                        day.getMonth() === startTime.getMonth() &&
                        day.getDate() === startTime.getDate()
                );

                if (dayIndex === -1) return;

                // Calculate start and end cell indices
                const startMinutes = startTime.getHours() * 60 + startTime.getMinutes();
                const endMinutes = endTime.getHours() * 60 + endTime.getMinutes();

                const startY = Math.floor(startMinutes / intervalInMinutes);
                const endY = Math.floor(endMinutes / intervalInMinutes);

                // Mark all cells in this time range as available for this participant
                for (let y = startY; y < endY && y < cellsPerDay; y++) {
                    const key = cellKeyFromCoords(dayIndex, y);
                    const existing = availability.get(key) || { count: 0, participants: [] };
                    availability.set(key, {
                        count: existing.count + 1,
                        participants: [...existing.participants, participant]
                    });
                }
            });
        });

        return availability;
    });

    function getAvailabilityCount(x: number, y: number): number {
        return participantAvailability.get(cellKeyFromCoords(x, y))?.count || 0;
    }

    function getAvailableParticipants(x: number, y: number) {
        return participantAvailability.get(cellKeyFromCoords(x, y))?.participants || [];
    }

    function getAvailabilityColor(participantCount: number): string {
        return availabilityColorMap?.get(participantCount) || "var(--primary)";
    }

    $effect(() => {
        selectedTimes = cellsToTimeSelections(selectedCells, days, intervalInMinutes);
    });

    function handlePointerDown(event: PointerEvent) {
        if (!selectable) return;

        const el = document.elementFromPoint(event.clientX, event.clientY) as Element | null;
        const cell = el?.closest<HTMLElement>(".cell");

        if (!cell || !timeGrid.contains(cell)) return;

        const x = Number(cell.dataset.x);
        const y = Number(cell.dataset.y);

        if (lastHovered && lastHovered[0] === x && lastHovered[1] === y) {
            return;
        }

        // Set selection
        isSelecting = true;
        lastHovered = [x, y];
        hoveredCell = [x, y];
        startCell = [x, y];
        endCell = [x, y];
        mode = selectedCells.some(([sx, sy]) => sx === x && sy === y) ? "remove" : "add";
    }

    function handlePointerMove(event: PointerEvent) {
        const el = document.elementFromPoint(event.clientX, event.clientY) as Element | null;
        const cell = el?.closest<HTMLElement>(".cell");

        if (!cell || !timeGrid.contains(cell)) {
            hoveredCell = null;
            if (!isSelecting) return;
            return;
        }

        const x = Number(cell.dataset.x);
        const y = Number(cell.dataset.y);

        if (lastHovered && lastHovered[0] === x && lastHovered[1] === y) {
            return;
        }

        hoveredCell = [x, y];

        // Only handle selection if selectable and currently selecting
        if (!selectable || !isSelecting) return;

        // Update selection
        lastHovered = [x, y];
        endCell = [x, y];
    }

    function handlePointerUp(event: PointerEvent) {
        if (!selectable || !isSelecting) return;

        const el = document.elementFromPoint(event.clientX, event.clientY) as Element | null;
        const cell = el?.closest<HTMLElement>(".cell");

        if (!cell || !timeGrid.contains(cell)) return;

        if (mode === "add") {
            selectedCells.push(...currentSelectedCells);
        } else {
            selectedCells = selectedCells.filter(
                ([cx, cy]) => !currentSelectedCells.some(([sx, sy]) => sx === cx && sy === cy)
            );
        }

        // Reset selection
        isSelecting = false;
        lastHovered = null;
        startCell = null;
        endCell = null;
        mode = null;
    }
</script>

<svelte:window
    onpointerdown={handlePointerDown}
    onpointermove={handlePointerMove}
    onpointerup={handlePointerUp}
/>

<div
    bind:this={timeGrid}
    class={cn("grid grid-flow-col gap-1", className)}
    style={`grid-template-columns: repeat(${days.length + 1}, minmax(0, 1fr)); grid-template-rows: repeat(${cellsPerDay + 1}, ${cellHeight})`}
>
    <div class="mb-2 h-full w-full"></div>
    {#each generateTimeStrings(intervalInMinutes, false) as time, index}
        <div
            class="flex h-full w-full items-center justify-center p-2 text-xs text-muted-foreground"
        >
            {index % 4 == 0 ? time : ""}
        </div>
    {/each}
    {#each days as date, x}
        <div class="sticky top-0 flex h-full w-full flex-col items-center justify-center">
            <h2 class="text-sm font-bold">{getDayString(date).slice(0, 3)}</h2>
            <p class="text-sm text-muted-foreground">{date.getMonth()}/{date.getDate()}</p>
        </div>
        {#each Array(cellsPerDay) as _, y}
            {@const participantCount = getAvailabilityCount(x, y)}

            <TimeCell
                cell={[x, y]}
                selecting={currentSelectedCells.some(([sx, sy]) => sx === x && sy === y)}
                selected={selectedCells.some(([sx, sy]) => sx === x && sy === y)}
                {participantCount}
                totalParticipants={participants?.length || 0}
                availableParticipants={getAvailableParticipants(x, y)}
                cellColor={getAvailabilityColor(participantCount)}
                {selectable}
            />
        {/each}
    {/each}
</div>

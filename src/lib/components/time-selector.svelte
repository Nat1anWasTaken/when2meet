<script lang="ts">
    import { onDestroy } from "svelte";
    import { SvelteSet } from "svelte/reactivity";
    import TimeCell from "$lib/components/time-cell.svelte";
    import TimeCellTooltip from "$lib/components/time-cell-tooltip.svelte";
    import {
        cn,
        generateDaysArray,
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
        showDates?: boolean;
        intervalInMinutes?: number;
        cellHeight?: string;
        selectable?: boolean;
        hoveredCell?: Cell | null;
        selectedCells?: Cell[];
        participants?: Array<{
            id: number;
            username: string;
            timeSelection: { startTime: Date; endTime: Date }[];
            user?: {
                image?: string | null;
            } | null;
        }>;
        availabilityColorMap?: AvailabilityColorMap;
    }

    let {
        class: className,
        startDate,
        endDate,
        showDates = false,
        intervalInMinutes = 30,
        cellHeight = "1fr",
        selectable = $bindable(false),
        hoveredCell = $bindable(null),
        selectedCells = $bindable([]),
        participants = [],
        availabilityColorMap
    }: Props = $props();

    let days = $derived(generateDaysArray(startDate, endDate));

    let cellsPerDay = $derived((60 * 24) / intervalInMinutes);

    let timeGrid: HTMLElement;
    const componentId = $props.id();
    const tooltipId = `${componentId}-availability-tooltip`;

    // Select related states
    let mode = $state<"add" | "remove" | null>(null);
    let isSelecting = $state<boolean>(false);
    let lastHovered = $state<Cell | null>(null);
    let startCell = $state<Cell | null>(null);
    let endCell = $state<Cell | null>(null);
    let tooltipAnchor = $state<HTMLElement | null>(null);
    let tooltipOpen = $state(false);
    let tooltipCloseTimer: ReturnType<typeof setTimeout> | null = null;
    let currentSelectedCells = $derived(
        startCell && endCell ? rectCellsArray(startCell, endCell) : []
    );

    function cellKeyFromCoords(x: number, y: number): string {
        return `${x},${y}`;
    }

    // Calculate participant availability for each cell
    let participantAvailability = $derived.by(() => {
        if (!participants?.length) return new Map<string, typeof participants>();

        // eslint-disable-next-line svelte/prefer-svelte-reactivity
        const availability = new Map<string, typeof participants>();
        const orderedParticipants = [...participants].sort((a, b) => a.id - b.id);

        // Store each participant at most once per cell and keep a canonical order.
        orderedParticipants.forEach((participant) => {
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
                let endMinutes = endTime.getHours() * 60 + endTime.getMinutes();

                if (endTime.getTime() > startTime.getTime() && endMinutes <= startMinutes) {
                    endMinutes += 24 * 60;
                }

                const startY = Math.floor(startMinutes / intervalInMinutes);
                const endY = Math.floor(endMinutes / intervalInMinutes);

                // Mark all cells in this time range as available for this participant
                for (let y = startY; y < endY && y < cellsPerDay; y++) {
                    const key = cellKeyFromCoords(dayIndex, y);
                    const existing = availability.get(key) || [];
                    if (!existing.some(({ id }) => id === participant.id)) {
                        availability.set(key, [...existing, participant]);
                    }
                }
            });
        });

        return availability;
    });

    function getAvailabilityCount(x: number, y: number): number {
        return getAvailableParticipants(x, y).length;
    }

    function getAvailableParticipants(x: number, y: number) {
        return participantAvailability.get(cellKeyFromCoords(x, y)) || [];
    }

    function getAvailabilityColor(participantCount: number): string {
        return availabilityColorMap?.get(participantCount) || "var(--primary)";
    }

    let hoveredParticipants = $derived(
        hoveredCell ? getAvailableParticipants(hoveredCell[0], hoveredCell[1]) : []
    );

    function cancelTooltipClose() {
        if (tooltipCloseTimer === null) return;
        clearTimeout(tooltipCloseTimer);
        tooltipCloseTimer = null;
    }

    function showTooltip(cell: HTMLElement, x: number, y: number) {
        if (selectable) return;

        cancelTooltipClose();
        if (tooltipAnchor === cell && hoveredCell?.[0] === x && hoveredCell?.[1] === y) {
            tooltipOpen = true;
            return;
        }

        tooltipAnchor = cell;
        hoveredCell = [x, y];
        tooltipOpen = true;
    }

    function closeTooltip() {
        cancelTooltipClose();
        hoveredCell = null;
        tooltipOpen = false;
    }

    function scheduleTooltipClose() {
        if (tooltipCloseTimer !== null || !tooltipOpen) return;

        tooltipCloseTimer = setTimeout(() => {
            tooltipCloseTimer = null;
            hoveredCell = null;
            tooltipOpen = false;
        }, 60);
    }

    function getEventCell(event: Event): HTMLElement | null {
        const target = event.target;
        if (!(target instanceof Element)) return null;

        const cell = target.closest<HTMLElement>(".cell");
        return cell && timeGrid.contains(cell) ? cell : null;
    }

    function showTooltipForElement(cell: HTMLElement) {
        const x = Number(cell.dataset.x);
        const y = Number(cell.dataset.y);
        if (!Number.isFinite(x) || !Number.isFinite(y)) return;

        showTooltip(cell, x, y);
    }

    function handleFocusIn(event: FocusEvent) {
        const cell = getEventCell(event);
        if (cell) showTooltipForElement(cell);
    }

    function handleFocusOut() {
        scheduleTooltipClose();
    }

    export function resetSelection() {
        startCell = null;
        endCell = null;
        lastHovered = null;
        selectedCells = [];
    }

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

        // Set pointer capture for better mobile touch handling
        if (event.target instanceof Element) {
            event.target.setPointerCapture(event.pointerId);
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
            if (!selectable) scheduleTooltipClose();
            if (!isSelecting) return;
            return;
        }

        const x = Number(cell.dataset.x);
        const y = Number(cell.dataset.y);

        if (!selectable) {
            showTooltip(cell, x, y);
            return;
        }

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
            // Use Set to prevent duplicates
            const cellSet = new SvelteSet(selectedCells.map(([x, y]) => cellKeyFromCoords(x, y)));
            currentSelectedCells.forEach(([x, y]) => cellSet.add(cellKeyFromCoords(x, y)));

            // Convert back to array of [x, y] tuples
            selectedCells = Array.from(cellSet).map((key) => {
                const [x, y] = key.split(",").map(Number);
                return [x, y] as Cell;
            });
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

    $effect(() => {
        if (selectable) closeTooltip();
    });

    onDestroy(cancelTooltipClose);
</script>

<svelte:window
    onpointerdown={handlePointerDown}
    onpointermove={handlePointerMove}
    onpointerup={handlePointerUp}
/>

<div
    bind:this={timeGrid}
    onfocusin={handleFocusIn}
    onfocusout={handleFocusOut}
    class={cn(
        "grid grid-flow-col p-2 transition-all duration-200 ease-in-out",
        selectable ? "gap-3" : "gap-1",
        className
    )}
    style={`grid-template-columns: repeat(${days.length + 1}, minmax(0, 1fr)); grid-template-rows: repeat(${cellsPerDay + 1}, ${cellHeight})`}
>
    <div class="mb-2 h-full w-full"></div>
    {#each generateTimeStrings(intervalInMinutes, false) as time, index (index)}
        <div
            class={cn(
                "flex h-full w-full items-center justify-center p-2 text-xs text-muted-foreground",
                {
                    "border-t-1 border-muted": index % 4 === 0
                }
            )}
        >
            {time}
        </div>
    {/each}
    {#each days as date, x (date.getTime())}
        <div class="sticky top-0 flex h-full w-full flex-col items-center justify-center">
            <h2 class="text-sm font-bold">{getDayString(date).slice(0, 3)}</h2>
            {#if showDates}
                <p class="text-sm text-muted-foreground">{date.getMonth() + 1}/{date.getDate()}</p>
            {/if}
        </div>
        {#each Array(cellsPerDay).entries() as [y] (y)}
            {@const participantCount = getAvailabilityCount(x, y)}

            <TimeCell
                cell={[x, y]}
                selecting={currentSelectedCells.some(([sx, sy]) => sx === x && sy === y)}
                selected={selectedCells.some(([sx, sy]) => sx === x && sy === y)}
                cellColor={getAvailabilityColor(participantCount)}
                {selectable}
                tooltipId={tooltipOpen &&
                !selectable &&
                hoveredCell?.[0] === x &&
                hoveredCell?.[1] === y
                    ? tooltipId
                    : undefined}
            />
        {/each}
    {/each}
</div>

<TimeCellTooltip
    id={tooltipId}
    bind:open={tooltipOpen}
    anchor={tooltipAnchor}
    participantCount={hoveredParticipants.length}
    totalParticipants={participants?.length || 0}
    availableParticipants={hoveredParticipants}
/>

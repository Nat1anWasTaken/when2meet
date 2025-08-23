<script lang="ts">
    import { cn, generateTimeStrings, getDayString, rectCellsArray, type Cell } from "$lib/utils";
    import type { Snippet } from "svelte";

    interface Props {
        class?: string;
        startDate: Date;
        endDate: Date;
        intervalInMinutes?: number;
        cellHeight?: string;
        cell?: Snippet<[Cell, boolean, boolean]>;
        selectable?: boolean;
        hoveredCell?: Cell | null;
    }

    let {
        class: className,
        startDate,
        endDate,
        intervalInMinutes = 30,
        cellHeight = "1fr",
        cell,
        selectable = $bindable(false),
        hoveredCell = $bindable(null)
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

    let availableCells = $state<Cell[]>([]);

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
        mode = availableCells.some(([sx, sy]) => sx === x && sy === y) ? "remove" : "add";
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
            availableCells.push(...currentSelectedCells);
        } else {
            availableCells = availableCells.filter(
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

{#snippet defaultCell(cell: Cell, selected: boolean, available: boolean)}
    <div
        data-x={cell[0]}
        data-y={cell[1]}
        class={cn(
            "cell flex h-full w-full items-center justify-center select-none",
            selected
                ? "bg-primary/80 hover:bg-primary/70"
                : available
                  ? "bg-primary hover:bg-primary/80"
                  : "bg-accent hover:bg-accent/50"
        )}
    ></div>
{/snippet}

<svelte:window
    onpointerdown={handlePointerDown}
    onpointermove={handlePointerMove}
    onpointerup={handlePointerUp}
/>

<div
    bind:this={timeGrid}
    class={cn("grid grid-flow-col gap-x-1", className)}
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
            {#if cell}
                {@render cell(
                    [x, y],
                    currentSelectedCells.some(([sx, sy]) => sx === x && sy === y),
                    availableCells.some(([sx, sy]) => sx === x && sy === y)
                )}
            {:else}
                {@render defaultCell(
                    [x, y],
                    currentSelectedCells.some(([sx, sy]) => sx === x && sy === y),
                    availableCells.some(([sx, sy]) => sx === x && sy === y)
                )}
            {/if}
        {/each}
    {/each}
</div>

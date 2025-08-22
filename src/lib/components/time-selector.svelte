<script lang="ts">
    import { cn, generateTimeStrings, rectCellsArray, type Cell } from "$lib/utils";
    import type { Snippet } from "svelte";

    interface Props {
        class?: string;
        days?: number;
    }

    let { class: className, days = 7 }: Props = $props();

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
        const el = document.elementFromPoint(event.clientX, event.clientY) as Element | null;
        const cell = el?.closest<HTMLElement>(".cell");

        if (!cell || !timeGrid.contains(cell)) return;

        const x = Number(cell.dataset.x);
        const y = Number(cell.dataset.y);

        if (lastHovered && lastHovered[0] === x && lastHovered[1] === y) {
            return;
        }

        lastHovered = [x, y];
        isSelecting = true;

        // do whatever with the coordinates, like mark it selected
        startCell = [x, y];
        endCell = [x, y];

        mode = availableCells.some(([sx, sy]) => sx === x && sy === y) ? "remove" : "add";
    }

    function handlePointerMove(event: PointerEvent) {
        if (!isSelecting) return;

        const el = document.elementFromPoint(event.clientX, event.clientY) as Element | null;
        const cell = el?.closest<HTMLElement>(".cell");

        if (!cell || !timeGrid.contains(cell)) return;

        const x = Number(cell.dataset.x);
        const y = Number(cell.dataset.y);

        if (lastHovered && lastHovered[0] === x && lastHovered[1] === y) {
            return;
        }

        lastHovered = [x, y];

        // do whatever with the index
        endCell = [x, y];
    }

    function handlePointerUp(event: PointerEvent) {
        if (!isSelecting) return;

        const el = document.elementFromPoint(event.clientX, event.clientY) as Element | null;
        const cell = el?.closest<HTMLElement>(".cell");

        if (!cell || !timeGrid.contains(cell)) return;

        const x = Number(cell.dataset.x);
        const y = Number(cell.dataset.y);

        if (mode === "add") {
            availableCells.push(...currentSelectedCells);
        } else {
            availableCells = availableCells.filter(
                ([cx, cy]) => !currentSelectedCells.some(([sx, sy]) => sx === cx && sy === cy)
            );
        }

        mode = null;

        isSelecting = false;
        lastHovered = null;

        startCell = null;
        endCell = null;
    }

    function getCellColor(cell: Cell): string {
        if (currentSelectedCells.some(([sx, sy]) => sx === cell[0] && sy === cell[1])) {
            return "bg-accent-foreground";
        }

        if (availableCells.some(([sx, sy]) => sx === cell[0] && sy === cell[1])) {
            return "bg-primary";
        }

        return "bg-accent";
    }
</script>

<svelte:window
    onpointerdown={handlePointerDown}
    onpointermove={handlePointerMove}
    onpointerup={handlePointerUp}
/>

<div
    bind:this={timeGrid}
    class={cn("grid grid-flow-col grid-rows-48", className)}
    style={`grid-template-columns: repeat(${days + 1}, minmax(0, 1fr));`}
>
    {#each generateTimeStrings(30, false) as time, index}
        <div
            class="flex h-full w-full items-center justify-center border-x-1 p-2 text-xs text-muted-foreground"
        >
            {index % 4 == 0 ? time : ""}
        </div>
    {/each}
    {#each Array(days) as _, x}
        {#each Array(48) as _, y}
            <div
                data-x={x}
                data-y={y}
                class={cn(
                    "cell flex h-full w-full items-center justify-center border-x-1 border-y-0 select-none",
                    getCellColor([x, y])
                )}
            >
                {x}, {y}
            </div>
        {/each}
    {/each}
</div>

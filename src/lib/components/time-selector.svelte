<script lang="ts">
    import { cn, generateTimeStrings, rectCellsArray, type Cell } from "$lib/utils";
    import type { Snippet } from "svelte";

    interface Props {
        class?: string;
        days?: number;
        cell?: Snippet<[Cell, boolean, boolean]>;
    }

    let { class: className, days = 7, cell }: Props = $props();

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

        // Set selection
        isSelecting = true;
        lastHovered = [x, y];
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

        // Update selection
        lastHovered = [x, y];
        endCell = [x, y];
    }

    function handlePointerUp(event: PointerEvent) {
        if (!isSelecting) return;

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
    <di
        data-x={cell[0]}
        data-y={cell[1]}
        class={cn(
            "cell flex h-full w-full items-center justify-center rounded-xl select-none",
            selected ? "bg-primary/70" : available ? "bg-primary" : "bg-accent hover:bg-accent/50"
        )}
    >
        {cell[0]}, {cell[1]}
    </di>
{/snippet}

<svelte:window
    onpointerdown={handlePointerDown}
    onpointermove={handlePointerMove}
    onpointerup={handlePointerUp}
/>

<div
    bind:this={timeGrid}
    class={cn("grid grid-flow-col grid-rows-48 gap-1", className)}
    style={`grid-template-columns: repeat(${days + 1}, minmax(0, 1fr));`}
>
    {#each generateTimeStrings(30, false) as time, index}
        <div
            class="flex h-full w-full items-center justify-center p-2 text-xs text-muted-foreground"
        >
            {index % 4 == 0 ? time : ""}
        </div>
    {/each}
    {#each Array(days) as _, x}
        {#each Array(48) as _, y}
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

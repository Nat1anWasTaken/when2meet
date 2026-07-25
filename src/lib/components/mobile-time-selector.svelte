<script lang="ts">
    import { tick } from "svelte";
    import { SvelteMap } from "svelte/reactivity";
    import { toast } from "svelte-sonner";
    import { m } from "$i18n";
    import { Button } from "$lib/components/ui/button";
    import * as Dialog from "$lib/components/ui/dialog";
    import * as Select from "$lib/components/ui/select";
    import { getLocale } from "$lib/paraglide/runtime";
    import {
        addDayCellRange,
        copyDayCells,
        generateDaysArray,
        getDayCellRanges,
        removeDayCellRange,
        replaceDayCellRange,
        type Cell,
        type CellRange
    } from "$lib/utils";
    import IconArrowRight from "~icons/lucide/arrow-right";
    import IconChevronLeft from "~icons/lucide/chevron-left";
    import IconChevronRight from "~icons/lucide/chevron-right";
    import IconCopy from "~icons/lucide/copy";
    import IconTrash from "~icons/lucide/trash-2";

    interface Props {
        startDate: Date;
        endDate: Date;
        showDates?: boolean;
        intervalInMinutes?: number;
        selectedCells?: Cell[];
        participants?: Array<{
            username: string;
            timeSelection: { startTime: Date; endTime: Date }[];
        }>;
    }

    let {
        startDate,
        endDate,
        showDates = true,
        intervalInMinutes = 60,
        selectedCells = $bindable([]),
        participants = []
    }: Props = $props();

    const days = $derived(generateDaysArray(startDate, endDate));
    const rowsPerDay = $derived((24 * 60) / intervalInMinutes);

    let rootElement = $state<HTMLElement | null>(null);
    let dateStripElement = $state<HTMLElement | null>(null);
    let selectedDayIndex = $state(getInitialDayIndex());
    let pendingStartRow = $state<number | null>(null);

    let editDialogOpen = $state(false);
    let editingRange = $state<CellRange | null>(null);
    let editStart = $state("0");
    let editEnd = $state("1");
    let lastEditedRangeStart = $state<number | null>(null);
    let editDialogWasOpen = $state(false);

    let copyDialogOpen = $state(false);
    let copyTargetDays = $state<number[]>([]);
    let copyTriggerElement = $state<HTMLButtonElement | null>(null);
    let copyDialogWasOpen = $state(false);

    const dayRanges = $derived(getDayCellRanges(selectedCells, selectedDayIndex));
    const selectedHours = $derived(
        dayRanges.reduce((total, range) => total + range.endRow - range.startRow, 0)
    );
    const totalSelectedHours = $derived(selectedCells.length * (intervalInMinutes / 60));
    const selectedDayCount = $derived(new Set(selectedCells.map(([day]) => day)).size);

    $effect(() => {
        if (editDialogOpen) {
            editDialogWasOpen = true;
            return;
        }

        if (editDialogWasOpen) {
            editDialogWasOpen = false;
            tick().then(() => {
                const trigger =
                    lastEditedRangeStart === null
                        ? null
                        : rootElement?.querySelector<HTMLButtonElement>(
                              `button[data-range-start="${lastEditedRangeStart}"]:not([aria-hidden="true"])`
                          );
                (trigger ?? rootElement)?.focus();
            });
        }
    });

    $effect(() => {
        if (copyDialogOpen) {
            copyDialogWasOpen = true;
            return;
        }

        if (copyDialogWasOpen) {
            copyDialogWasOpen = false;
            tick().then(() => copyTriggerElement?.focus());
        }
    });

    const participantAvailability = $derived.by(() => {
        const counts = new SvelteMap<string, number>();

        for (const participant of participants) {
            for (const selection of participant.timeSelection) {
                const start = new Date(selection.startTime);
                const end = new Date(selection.endTime);
                const dayIndex = days.findIndex(
                    (day) =>
                        day.getFullYear() === start.getFullYear() &&
                        day.getMonth() === start.getMonth() &&
                        day.getDate() === start.getDate()
                );
                if (dayIndex < 0) continue;

                const startMinutes = start.getHours() * 60 + start.getMinutes();
                let endMinutes = end.getHours() * 60 + end.getMinutes();
                if (end.getTime() > start.getTime() && endMinutes <= startMinutes) {
                    endMinutes += 24 * 60;
                }

                const startRow = Math.floor(startMinutes / intervalInMinutes);
                const endRow = Math.min(rowsPerDay, Math.ceil(endMinutes / intervalInMinutes));
                for (let row = startRow; row < endRow; row++) {
                    const key = `${dayIndex},${row}`;
                    counts.set(key, (counts.get(key) ?? 0) + 1);
                }
            }
        }

        return counts;
    });

    function getInitialDayIndex() {
        const firstSelectedDay = selectedCells.map(([day]) => day).sort((a, b) => a - b)[0];
        if (firstSelectedDay !== undefined) return firstSelectedDay;

        const now = new Date();
        const todayIndex = days.findIndex(
            (day) =>
                day.getFullYear() === now.getFullYear() &&
                day.getMonth() === now.getMonth() &&
                day.getDate() === now.getDate()
        );
        return todayIndex >= 0 ? todayIndex : 0;
    }

    function formatDate(date: Date, options: Intl.DateTimeFormatOptions) {
        return new Intl.DateTimeFormat(
            getLocale() === "zh-hant-tw" ? "zh-TW" : "en-US",
            options
        ).format(date);
    }

    function formatUnit(value: number, unit: "day" | "hour") {
        return new Intl.NumberFormat(getLocale() === "zh-hant-tw" ? "zh-TW" : "en-US", {
            style: "unit",
            unit,
            unitDisplay: "long"
        }).format(value);
    }

    function formatHour(row: number) {
        const totalMinutes = row * intervalInMinutes;
        const hour = Math.floor(totalMinutes / 60);
        const minute = totalMinutes % 60;
        if (hour === 24) return "24:00";
        return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    }

    function getDayHours(day: number) {
        return (
            selectedCells.filter(([cellDay]) => cellDay === day).length * (intervalInMinutes / 60)
        );
    }

    function getRangeForRow(row: number) {
        return dayRanges.find((range) => row >= range.startRow && row < range.endRow);
    }

    function getParticipantCount(row: number) {
        return participantAvailability.get(`${selectedDayIndex},${row}`) ?? 0;
    }

    async function selectDay(index: number) {
        if (index < 0 || index >= days.length || index === selectedDayIndex) return;

        pendingStartRow = null;
        selectedDayIndex = index;
        await tick();

        const button = dateStripElement?.querySelector<HTMLElement>(`[data-day-index="${index}"]`);
        button?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }

    function selectRow(row: number) {
        const existingRange = getRangeForRow(row);
        if (existingRange) {
            openEditDialog(existingRange);
            return;
        }

        if (pendingStartRow === null) {
            pendingStartRow = row;
            return;
        }

        const startRow = Math.min(pendingStartRow, row);
        const endRow = Math.max(pendingStartRow, row) + 1;
        selectedCells = addDayCellRange(selectedCells, selectedDayIndex, startRow, endRow);
        pendingStartRow = null;
    }

    function openEditDialog(range: CellRange) {
        pendingStartRow = null;
        editingRange = range;
        lastEditedRangeStart = range.startRow;
        editStart = String(range.startRow);
        editEnd = String(range.endRow);
        editDialogOpen = true;
    }

    function updateRange() {
        if (!editingRange) return;

        const nextRange = {
            startRow: Number(editStart),
            endRow: Number(editEnd)
        };
        if (nextRange.endRow <= nextRange.startRow) return;

        selectedCells = replaceDayCellRange(
            selectedCells,
            selectedDayIndex,
            editingRange,
            nextRange
        );
        editDialogOpen = false;
        editingRange = null;
    }

    function deleteRange() {
        if (!editingRange) return;

        selectedCells = removeDayCellRange(
            selectedCells,
            selectedDayIndex,
            editingRange.startRow,
            editingRange.endRow
        );
        editDialogOpen = false;
        editingRange = null;
    }

    function openCopyDialog() {
        copyTargetDays = [];
        copyDialogOpen = true;
    }

    async function toggleCopyTarget(day: number, trigger: HTMLButtonElement) {
        copyTargetDays = copyTargetDays.includes(day)
            ? copyTargetDays.filter((target) => target !== day)
            : [...copyTargetDays, day];
        await tick();
        trigger.focus();
    }

    function copyToDays() {
        if (copyTargetDays.length === 0) return;

        const snapshot = selectedCells.map(([day, row]) => [day, row] as Cell);
        selectedCells = copyDayCells(selectedCells, selectedDayIndex, copyTargetDays);
        copyDialogOpen = false;
        setTimeout(() => {
            toast.success(m.mobile_time_copy_success(), {
                action: {
                    label: m.mobile_time_undo(),
                    onClick: () => {
                        selectedCells = snapshot;
                    }
                }
            });
        }, 250);
    }

    function scrollToInitialHour() {
        const firstRange = getDayCellRanges(selectedCells, selectedDayIndex)[0];
        const targetRow = firstRange?.startRow ?? 8;
        const row = rootElement?.querySelector<HTMLElement>(`[data-time-row="${targetRow}"]`);
        row?.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    export async function focusEditor() {
        if (!window.matchMedia("(max-width: 767px)").matches) return;
        rootElement?.scrollIntoView({ behavior: "smooth", block: "start" });
        await tick();
        scrollToInitialHour();
    }
</script>

<section
    bind:this={rootElement}
    class="scroll-mt-4 md:hidden"
    aria-label={m.mobile_time_editor()}
    tabindex="-1"
>
    <div>
        <div
            class="sticky top-[var(--mobile-navbar-offset,0px)] z-20 border-b border-accent bg-background transition-[top] duration-200 ease-out motion-reduce:transition-none"
        >
            <div class="flex items-center gap-1 p-2">
                <Button
                    variant="ghost"
                    size="icon"
                    class="size-11"
                    onclick={() => selectDay(selectedDayIndex - 1)}
                    disabled={selectedDayIndex === 0}
                    aria-label={m.mobile_time_previous_day()}
                >
                    <IconChevronLeft />
                </Button>

                <div
                    bind:this={dateStripElement}
                    class="flex min-w-0 flex-1 snap-x gap-1 overflow-x-auto px-1 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                >
                    {#each days as day, index (day.getTime())}
                        {@const hours = getDayHours(index)}
                        <button
                            type="button"
                            data-day-index={index}
                            class={[
                                "min-h-14 min-w-16 snap-center rounded-lg px-2 py-1 text-center transition-colors",
                                selectedDayIndex === index
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "bg-muted text-muted-foreground hover:bg-accent"
                            ]}
                            onclick={() => selectDay(index)}
                            aria-current={selectedDayIndex === index ? "date" : undefined}
                        >
                            <span class="block text-xs font-medium">
                                {formatDate(day, { weekday: "short" })}
                            </span>
                            <span class="block text-sm font-bold">
                                {showDates
                                    ? formatDate(day, { month: "numeric", day: "numeric" })
                                    : formatDate(day, { weekday: "long" })}
                            </span>
                            <span class="block text-[10px] opacity-80">
                                {hours > 0
                                    ? m.mobile_time_hours_short({ hours })
                                    : m.mobile_time_not_set()}
                            </span>
                        </button>
                    {/each}
                </div>

                <Button
                    variant="ghost"
                    size="icon"
                    class="size-11"
                    onclick={() => selectDay(selectedDayIndex + 1)}
                    disabled={selectedDayIndex === days.length - 1}
                    aria-label={m.mobile_time_next_day()}
                >
                    <IconChevronRight />
                </Button>
            </div>

            <div
                class="flex min-h-12 items-center justify-between gap-3 border-t border-accent px-3 py-2"
            >
                <div class="min-w-0">
                    {#if pendingStartRow !== null}
                        <p class="truncate text-sm font-semibold text-primary" aria-live="polite">
                            {m.mobile_time_choose_end({
                                time: formatHour(pendingStartRow)
                            })}
                        </p>
                    {:else}
                        <p class="text-sm font-semibold">
                            {formatDate(days[selectedDayIndex], {
                                weekday: "long",
                                month: "long",
                                day: "numeric"
                            })}
                        </p>
                        <p class="text-xs text-muted-foreground">
                            {m.mobile_time_tap_instruction()}
                        </p>
                    {/if}
                </div>

                {#if pendingStartRow !== null}
                    <Button
                        variant="ghost"
                        size="sm"
                        class="h-11"
                        onclick={() => (pendingStartRow = null)}
                    >
                        {m.mobile_time_cancel_start()}
                    </Button>
                {:else}
                    <span
                        class="shrink-0 rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary"
                    >
                        {m.mobile_time_hours({ hours: formatUnit(selectedHours, "hour") })}
                    </span>
                {/if}
            </div>
        </div>

        <div>
            {#each Array(rowsPerDay).entries() as [row] (row)}
                {@const range = getRangeForRow(row)}
                {@const rangeStart = range?.startRow === row}
                {@const rangeEnd = range?.endRow === row + 1}
                {@const participantCount = getParticipantCount(row)}
                <div
                    data-time-row={row}
                    class="grid min-h-15 grid-cols-[48px_minmax(140px,1fr)_minmax(72px,0.55fr)] border-b border-accent/70"
                >
                    <div
                        class="flex items-start justify-end border-r border-accent/70 px-2 pt-2 text-xs text-muted-foreground tabular-nums"
                    >
                        {formatHour(row)}
                    </div>

                    <button
                        type="button"
                        class={[
                            "relative m-1 min-h-13 touch-manipulation px-2 text-left transition-colors focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                            range
                                ? "border-x-2 border-primary bg-primary/20"
                                : pendingStartRow === row
                                  ? "rounded-lg border-2 border-primary bg-primary/20 shadow-sm"
                                  : "rounded-md border border-dashed border-accent hover:border-primary/60 hover:bg-primary/5",
                            rangeStart
                                ? "mt-1 rounded-t-lg border-t-2"
                                : range
                                  ? "mt-0 border-t-0"
                                  : "",
                            rangeEnd
                                ? "mb-1 rounded-b-lg border-b-2"
                                : range
                                  ? "mb-0 border-b-0"
                                  : ""
                        ]}
                        data-range-start={range?.startRow}
                        tabindex={range && !rangeStart ? -1 : undefined}
                        aria-hidden={range && !rangeStart ? "true" : undefined}
                        onclick={() => selectRow(row)}
                        aria-label={range
                            ? m.mobile_time_edit_range({
                                  start: formatHour(range.startRow),
                                  end: formatHour(range.endRow)
                              })
                            : pendingStartRow === null
                              ? m.mobile_time_select_start({ time: formatHour(row) })
                              : m.mobile_time_select_end({ time: formatHour(row) })}
                    >
                        {#if rangeStart && range}
                            <span class="block text-xs font-bold text-primary">
                                {formatHour(range.startRow)}–{formatHour(range.endRow)}
                            </span>
                            <span class="block text-[11px] text-primary/80">
                                {m.mobile_time_hours({
                                    hours: formatUnit(range.endRow - range.startRow, "hour")
                                })}
                            </span>
                        {:else if pendingStartRow === row}
                            <span class="text-xs font-bold text-primary">
                                {m.mobile_time_start_marker()}
                            </span>
                        {/if}
                    </button>

                    <div class="flex flex-col justify-center px-2 text-xs">
                        {#if rangeStart && range}
                            <span class="font-medium text-primary">
                                {m.mobile_time_selected()}
                            </span>
                        {/if}
                        {#if participants.length > 0}
                            <span class="text-muted-foreground">
                                {m.mobile_time_available_count({
                                    count: participantCount,
                                    total: participants.length
                                })}
                            </span>
                        {:else if !rangeStart}
                            <span class="text-muted-foreground/60">—</span>
                        {/if}
                    </div>
                </div>
            {/each}
        </div>

        <div class="grid grid-cols-2 gap-2 border-t border-accent bg-background p-3">
            <Button
                bind:ref={copyTriggerElement}
                variant="outline"
                class="h-11"
                onclick={openCopyDialog}
                disabled={dayRanges.length === 0 || days.length < 2}
            >
                <IconCopy />
                {m.mobile_time_copy_to_days()}
            </Button>
            <Button
                variant="secondary"
                class="h-11"
                onclick={() => selectDay(selectedDayIndex + 1)}
                disabled={selectedDayIndex === days.length - 1}
            >
                {m.mobile_time_next_day()}
                <IconArrowRight />
            </Button>
        </div>
    </div>

    <p class="mt-3 text-center text-xs text-muted-foreground">
        {m.mobile_time_summary({
            days: formatUnit(selectedDayCount, "day"),
            hours: formatUnit(totalSelectedHours, "hour")
        })}
    </p>
</section>

<Dialog.Root bind:open={editDialogOpen}>
    <Dialog.Content>
        <Dialog.Header>
            <Dialog.Title>{m.mobile_time_edit_title()}</Dialog.Title>
            <Dialog.Description>{m.mobile_time_edit_description()}</Dialog.Description>
        </Dialog.Header>

        <div class="grid grid-cols-2 gap-3">
            <label class="flex flex-col gap-2 text-sm font-medium">
                {m.mobile_time_start_time()}
                <Select.Root type="single" bind:value={editStart}>
                    <Select.Trigger size="lg" class="w-full"
                        >{formatHour(Number(editStart))}</Select.Trigger
                    >
                    <Select.Content>
                        {#each Array(rowsPerDay).entries() as [row] (row)}
                            <Select.Item value={String(row)}>{formatHour(row)}</Select.Item>
                        {/each}
                    </Select.Content>
                </Select.Root>
            </label>

            <label class="flex flex-col gap-2 text-sm font-medium">
                {m.mobile_time_end_time()}
                <Select.Root type="single" bind:value={editEnd}>
                    <Select.Trigger size="lg" class="w-full"
                        >{formatHour(Number(editEnd))}</Select.Trigger
                    >
                    <Select.Content>
                        {#each Array(rowsPerDay).entries() as [row] (row)}
                            <Select.Item value={String(row + 1)}>{formatHour(row + 1)}</Select.Item>
                        {/each}
                    </Select.Content>
                </Select.Root>
            </label>
        </div>

        {#if Number(editEnd) <= Number(editStart)}
            <p class="text-sm text-destructive">{m.mobile_time_invalid_range()}</p>
        {/if}

        <Dialog.Footer class="flex-row justify-between sm:justify-between">
            <Button variant="destructive" class="h-11" onclick={deleteRange}>
                <IconTrash />
                {m.mobile_time_delete()}
            </Button>
            <Button
                class="h-11"
                onclick={updateRange}
                disabled={Number(editEnd) <= Number(editStart)}
            >
                {m.mobile_time_update()}
            </Button>
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root>

<Dialog.Root bind:open={copyDialogOpen}>
    <Dialog.Content>
        <Dialog.Header>
            <Dialog.Title>{m.mobile_time_copy_title()}</Dialog.Title>
            <Dialog.Description>
                {m.mobile_time_copy_description({
                    date: formatDate(days[selectedDayIndex], {
                        month: "numeric",
                        day: "numeric"
                    })
                })}
            </Dialog.Description>
        </Dialog.Header>

        <div class="max-h-72 space-y-2 overflow-y-auto">
            {#each days as day, index (day.getTime())}
                {#if index !== selectedDayIndex}
                    <button
                        type="button"
                        class={[
                            "flex min-h-12 w-full items-center justify-between rounded-lg border px-3 py-2 text-left",
                            copyTargetDays.includes(index)
                                ? "border-primary bg-primary/10"
                                : "border-accent hover:bg-accent"
                        ]}
                        aria-pressed={copyTargetDays.includes(index)}
                        onclick={(event) =>
                            toggleCopyTarget(index, event.currentTarget as HTMLButtonElement)}
                    >
                        <span>
                            <span class="block text-sm font-medium">
                                {formatDate(day, {
                                    weekday: "short",
                                    month: "numeric",
                                    day: "numeric"
                                })}
                            </span>
                            <span class="block text-xs text-muted-foreground">
                                {m.mobile_time_existing_hours({
                                    hours: formatUnit(getDayHours(index), "hour")
                                })}
                            </span>
                        </span>
                        <span
                            class={[
                                "flex size-5 items-center justify-center rounded border text-xs",
                                copyTargetDays.includes(index)
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-input"
                            ]}
                            aria-hidden="true"
                        >
                            {copyTargetDays.includes(index) ? "✓" : ""}
                        </span>
                    </button>
                {/if}
            {/each}
        </div>

        <Dialog.Footer>
            <Button variant="outline" class="h-11" onclick={() => (copyDialogOpen = false)}>
                {m.mobile_time_cancel_start()}
            </Button>
            <Button class="h-11" onclick={copyToDays} disabled={copyTargetDays.length === 0}>
                {m.mobile_time_copy_action({
                    count: formatUnit(copyTargetDays.length, "day")
                })}
            </Button>
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root>

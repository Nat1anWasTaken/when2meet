<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import * as Popover from "$lib/components/ui/popover";
    import { cn } from "$lib/utils";
    import type { DateRange } from "bits-ui";
    import IconChevronDown from "~icons/lucide/chevron-down";
    import { RangeCalendar } from "./ui/range-calendar";
    import { m } from "$i18n";

    interface Props {
        class?: string;
        minDays?: number;
        maxDays?: number;
        selectedDateRange?: DateRange;
    }

    let {
        class: className,
        minDays,
        maxDays,
        selectedDateRange = $bindable(undefined)
    }: Props = $props();

    let open = $state(false);
    let triggerRef = $state<HTMLButtonElement>(null!);
</script>

<Popover.Root bind:open>
    <Popover.Trigger bind:ref={triggerRef}>
        {#snippet child({ props })}
            <Button
                variant="outline"
                {...props}
                class={cn(
                    "justify-between",
                    className,
                    selectedDateRange ? "text-foreground" : "text-muted-foreground"
                )}
                aria-expanded={open}
            >
                <div class="flex flex-row justify-start gap-1">
                    {#if selectedDateRange?.start}
                        {selectedDateRange.start?.toString()}
                    {:else}
                        <span class="text-muted-foreground"
                            >{m.date_range_select_placeholder_start()}</span
                        >
                    {/if}
                    <span class="text-muted-foreground">－</span>
                    {#if selectedDateRange?.end}
                        {selectedDateRange.end?.toString()}
                    {:else}
                        <span class="text-muted-foreground"
                            >{m.date_range_select_placeholder_end()}</span
                        >
                    {/if}
                </div>

                <IconChevronDown />
            </Button>
        {/snippet}
    </Popover.Trigger>
    <Popover.Content class="p-0" side="top">
        <RangeCalendar
            bind:value={selectedDateRange}
            {minDays}
            {maxDays}
            class="flex w-full items-center justify-center"
        />
    </Popover.Content>
</Popover.Root>

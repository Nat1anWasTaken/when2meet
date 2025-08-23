<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import * as Popover from "$lib/components/ui/popover";
    import { cn } from "$lib/utils";
    import type { DateRange } from "bits-ui";
    import { ChevronDownIcon } from "lucide-svelte";
    import { RangeCalendar } from "./ui/range-calendar";

    interface Props {
        class?: string;
        selectedDateRange?: DateRange;
    }

    let { class: className, selectedDateRange = $bindable(undefined) }: Props = $props();

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
                {selectedDateRange?.start && selectedDateRange?.end
                    ? `${selectedDateRange.start?.toString()} － ${selectedDateRange.end?.toString()}`
                    : "Select a date range..."}
                <ChevronDownIcon />
            </Button>
        {/snippet}
    </Popover.Trigger>
    <Popover.Content class="p-0" side="top">
        <RangeCalendar
            bind:value={selectedDateRange}
            class="flex w-full items-center justify-center"
        />
    </Popover.Content>
</Popover.Root>

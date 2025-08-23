<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import * as Command from "$lib/components/ui/command";
    import * as Popover from "$lib/components/ui/popover";
    import { cn } from "$lib/utils";
    import type { DateRange } from "bits-ui";
    import { CheckIcon, ChevronDownIcon } from "lucide-svelte";
    import { tick } from "svelte";
    import { RangeCalendar } from "./ui/range-calendar";

    interface Props {
        class?: string;
        selectedDateRange?: DateRange;
    }

    let { class: className, selectedDateRange = $bindable(undefined) }: Props = $props();

    let open = $state(false);
    let triggerRef = $state<HTMLButtonElement>(null!);

    function closeAndFocusTrigger() {
        open = false;
        tick().then(() => {
            triggerRef.focus();
        });
    }
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

<script lang="ts">
    import { cn } from "$lib/utils";
    import * as Command from "$lib/components/ui/command";
    import * as Popover from "$lib/components/ui/popover";
    import { tick } from "svelte";
    import { Button } from "$lib/components/ui/button";
    import { CheckIcon, ChevronDownIcon } from "lucide-svelte";

    interface Props {
        class?: string;
        selectedTimezone?: string;
    }

    let { class: className, selectedTimezone = $bindable(undefined) }: Props = $props();

    let open = $state(false);
    let triggerRef = $state<HTMLButtonElement>(null!);

    const availableTimezones = $derived(Intl.supportedValuesOf("timeZone"));

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
                    selectedTimezone ? "text-foreground" : "text-muted-foreground"
                )}
                role="combobox"
                aria-expanded={open}
            >
                {selectedTimezone || "Select a timezone..."}
                <ChevronDownIcon />
            </Button>
        {/snippet}
    </Popover.Trigger>
    <Popover.Content class="p-0" side="top">
        <Command.Root>
            <Command.Input placeholder="Search timezone..." />
            <Command.List>
                <Command.Empty>No timezone found.</Command.Empty>
                <Command.Group>
                    {#each availableTimezones as timezone (timezone)}
                        <Command.Item
                            value={timezone}
                            onSelect={() => {
                                selectedTimezone = timezone;
                                closeAndFocusTrigger();
                            }}
                        >
                            <CheckIcon
                                class={cn(
                                    "mr-2 size-4",
                                    selectedTimezone !== timezone && "text-transparent"
                                )}
                            />
                            {timezone}
                        </Command.Item>
                    {/each}
                </Command.Group>
            </Command.List>
        </Command.Root>
    </Popover.Content>
</Popover.Root>

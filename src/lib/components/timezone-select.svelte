<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import * as Command from "$lib/components/ui/command";
    import * as Popover from "$lib/components/ui/popover";
    import { cn } from "$lib/utils";
    import IconCheck from "~icons/lucide/check";
    import IconChevronDown from "~icons/lucide/chevron-down";
    import { tick } from "svelte";
    import { m } from "$i18n";

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
                {selectedTimezone || m.timezone_select_placeholder()}
                <IconChevronDown />
            </Button>
        {/snippet}
    </Popover.Trigger>
    <Popover.Content class="p-0" side="top">
        <Command.Root>
            <Command.Input placeholder={m.timezone_select_search_placeholder()} />
            <Command.List>
                <Command.Empty>{m.timezone_select_no_results()}</Command.Empty>
                <Command.Group>
                    {#each availableTimezones as timezone (timezone)}
                        <Command.Item
                            value={timezone}
                            onSelect={() => {
                                selectedTimezone = timezone;
                                closeAndFocusTrigger();
                            }}
                        >
                            <IconCheck
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

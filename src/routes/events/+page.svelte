<script lang="ts">
    import Button from "$lib/components/ui/button/button.svelte";
    import Input from "$lib/components/ui/input/input.svelte";
    import Separator from "$lib/components/ui/separator/separator.svelte";
    import * as Select from "$lib/components/ui/select";
    import type { PageProps } from "./$types";
    import EventCard from "$lib/components/event-card.svelte";

    let { data }: PageProps = $props();

    let sort = $state("");

    let triggerContent = $derived(sort ? sort : "Sort");
</script>

<div class="flex h-full w-full items-center justify-center p-4">
    <div class="h-full w-full max-w-4xl">
        <h1 class="text-4xl font-bold">Events</h1>
        <p class="text-muted-foreground">all your events in one place</p>

        <Separator class="my-2" />

        <div class="flex flex-row items-center gap-2">
            <Input class="flex-1" placeholder="search" />
            <Select.Root type="single" bind:value={sort}>
                <Select.Trigger class="w-32">{triggerContent}</Select.Trigger>
                <Select.Content>
                    <Select.Item value="available-time">Available Time</Select.Item>
                    <Select.Item value="name">Name</Select.Item>
                </Select.Content>
            </Select.Root>
            <Button>New Event</Button>
        </div>

        <div class="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2">
            <EventCard weeklyRecurrence={false}>
                {#snippet name()}
                    New Event
                {/snippet}
                {#snippet organizer()}
                    Nathan
                {/snippet}
                {#snippet startTime()}
                    1970/1/1 0:00
                {/snippet}
                {#snippet endTime()}
                    1970/1/1 1:00
                {/snippet}
                {#snippet timezone()}
                    Asia/Taipei
                {/snippet}
            </EventCard><EventCard weeklyRecurrence={false}>
                {#snippet name()}
                    New Event
                {/snippet}
                {#snippet organizer()}
                    Nathan
                {/snippet}
                {#snippet startTime()}
                    1970/1/1 0:00
                {/snippet}
                {#snippet endTime()}
                    1970/1/1 1:00
                {/snippet}
                {#snippet timezone()}
                    Asia/Taipei
                {/snippet}
            </EventCard><EventCard weeklyRecurrence={false}>
                {#snippet name()}
                    New Event
                {/snippet}
                {#snippet organizer()}
                    Nathan
                {/snippet}
                {#snippet startTime()}
                    1970/1/1 0:00
                {/snippet}
                {#snippet endTime()}
                    1970/1/1 1:00
                {/snippet}
                {#snippet timezone()}
                    Asia/Taipei
                {/snippet}
            </EventCard>
        </div>
    </div>
</div>

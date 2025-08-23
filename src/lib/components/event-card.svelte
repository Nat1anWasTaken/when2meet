<script lang="ts">
    import { Badge } from "$lib/components/ui/badge";
    import * as Card from "$lib/components/ui/card";
    import { cn } from "$lib/utils";
    import { Calendar, Earth, Repeat, User } from "lucide-svelte";
    import Button from "./ui/button/button.svelte";

    interface Props {
        eventId: string;
        name: string;
        organizerName: string;
        weeklyRecurrence: boolean;
        availableTime?: {
            startTime: Date;
            endTime: Date;
        };
        timezone: string;
        showActions?: boolean;
        informationMode?: "compact" | "expanded";
        class?: string;
    }

    let {
        eventId,
        name,
        organizerName,
        weeklyRecurrence,
        availableTime,
        timezone,
        showActions = true,
        informationMode = "compact",
        class: className
    }: Props = $props();

    // Format datetime for display
    function formatDateTime(date: Date): string {
        return date.toLocaleDateString("en-US", {
            weekday: "short",
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit"
        });
    }
</script>

<Card.Root class={className}>
    <Card.Content>
        <div class="flex flex-col gap-3">
            <div class="flex flex-col gap-1">
                <Card.Title class="text-2xl">{name}</Card.Title>
                <div class="flex flex-row items-center gap-2">
                    <div class="flex flex-row items-center gap-1 text-sm text-muted-foreground">
                        <User class="h-4 w-4" />
                        <span>Organized by {organizerName}</span>
                    </div>
                    {#if weeklyRecurrence}
                        <Badge variant="outline">
                            <Repeat class="mr-1 h-4 w-4" />
                            Weekly
                        </Badge>
                    {/if}
                </div>
            </div>

            {#if availableTime}
                <div class="flex flex-col gap-2">
                    <h3 class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                        Event Details
                    </h3>

                    {#snippet timeRangeDisplay(availableTime: { startTime: Date; endTime: Date })}
                        <div class="flex items-center gap-2">
                            <Calendar class="h-4 w-4 shrink-0 text-muted-foreground" />
                            <div class="min-w-0">
                                <span class="block text-sm font-medium">Available Time</span>
                                <span class="text-sm text-muted-foreground">
                                    {formatDateTime(availableTime.startTime)}
                                    <span class="mx-1">~</span>
                                    {formatDateTime(availableTime.endTime)}
                                </span>
                            </div>
                        </div>
                    {/snippet}

                    {#snippet timezoneDisplay(timezone: string)}
                        <div class="flex items-center gap-2">
                            <Earth class="h-4 w-4 shrink-0 text-muted-foreground" />
                            <div class="min-w-0">
                                <span class="block text-sm font-medium">Timezone</span>
                                <span class="text-sm text-muted-foreground">{timezone}</span>
                            </div>
                        </div>
                    {/snippet}

                    {#if informationMode == "compact"}
                        <div class="flex flex-col gap-2">
                            {@render timeRangeDisplay(availableTime)}
                            {@render timezoneDisplay(timezone)}
                        </div>
                    {:else if informationMode == "expanded"}
                        <div class="grid w-full grid-cols-2 gap-2">
                            {@render timeRangeDisplay(availableTime)}
                            {@render timezoneDisplay(timezone)}
                        </div>
                    {/if}
                </div>
            {/if}

            {#if showActions}
                <div class="mt-2 grid w-full grid-cols-2 justify-center gap-2">
                    <Button class="w-full">Edit</Button>
                    <Button class="w-full" variant="outline" href={`/${eventId}`}>View</Button>
                </div>
            {/if}
        </div>
    </Card.Content>
</Card.Root>

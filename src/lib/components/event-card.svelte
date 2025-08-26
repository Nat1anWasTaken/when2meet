<script lang="ts">
    import { Badge } from "$lib/components/ui/badge";
    import * as Card from "$lib/components/ui/card";
    import { cn } from "$lib/utils";
    import IconCalendar from "~icons/lucide/calendar";
    import IconEarth from "~icons/lucide/earth";
    import IconRepeat from "~icons/lucide/repeat";
    import IconShare2 from "~icons/lucide/share-2";
    import IconUser from "~icons/lucide/user";

    import { m } from "$i18n";
    import EditEventDialog from "./edit-event-dialog.svelte";
    import ShareEventDialog from "./share-event-dialog.svelte";
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
        class: className
    }: Props = $props();

    // Format datetime for display
    function formatDateTime(date: Date): string {
        return date.toLocaleDateString("en-US", {
            weekday: "short",
            year: "numeric",
            month: "short",
            day: "numeric"
        });
    }
</script>

<Card.Root class={cn("@container", className)}>
    <Card.Content>
        <div class="flex flex-col gap-3">
            <div class="flex flex-row justify-between">
                <div class="flex flex-col gap-1">
                    <Card.Title class="text-2xl">{name}</Card.Title>
                    <div class="flex flex-row items-center gap-2">
                        <div class="flex flex-row items-center gap-1 text-sm text-muted-foreground">
                            <IconUser class="h-4 w-4" />
                            <span>{m.event_card_organized_by()} {organizerName}</span>
                        </div>
                        {#if weeklyRecurrence}
                            <Badge variant="outline">
                                <IconRepeat class="mr-1 h-4 w-4" />
                                {m.event_card_badge_weekly()}
                            </Badge>
                        {/if}
                    </div>
                </div>
                <div class="flex items-start justify-end">
                    <ShareEventDialog {eventId} eventName={name}>
                        <Button variant="ghost" size="sm" aria-label="Share event">
                            <IconShare2 class="h-4 w-4" />
                        </Button>
                    </ShareEventDialog>
                </div>
            </div>

            {#if availableTime}
                <div class="flex flex-col gap-2">
                    <h3 class="text-xs font-medium tracking-wide text-muted-foreground">
                        {m.event_card_section_event_details()}
                    </h3>

                    {#snippet timeRangeDisplay(availableTime: { startTime: Date; endTime: Date })}
                        <div class="flex items-center gap-2">
                            <IconCalendar class="h-4 w-4 shrink-0 text-muted-foreground" />
                            <div class="min-w-0">
                                <span class="block text-sm font-medium"
                                    >{m.event_card_available_time()}</span
                                >
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
                            <IconEarth class="h-4 w-4 shrink-0 text-muted-foreground" />
                            <div class="min-w-0">
                                <span class="block text-sm font-medium"
                                    >{m.event_card_timezone()}</span
                                >
                                <span class="text-sm text-muted-foreground">{timezone}</span>
                            </div>
                        </div>
                    {/snippet}

                    <div class="flex flex-col gap-2 @lg:grid @lg:w-full @lg:grid-cols-2">
                        {@render timeRangeDisplay(availableTime)}
                        {@render timezoneDisplay(timezone)}
                    </div>
                </div>
            {/if}

            {#if showActions}
                <div class="mt-2 grid w-full grid-cols-2 justify-center gap-2">
                    <EditEventDialog {eventId} {name} {organizerName} {availableTime} {timezone}>
                        <Button class="w-full">{m.event_card_button_edit()}</Button>
                    </EditEventDialog>
                    <Button class="w-full" variant="outline" href={`/${eventId}`}
                        >{m.event_card_button_view()}</Button
                    >
                </div>
            {/if}
        </div>
    </Card.Content>
</Card.Root>

<script lang="ts">
    import { Badge } from "$lib/components/ui/badge";
    import * as Card from "$lib/components/ui/card";
    import { Calendar, Earth, Repeat, User } from "lucide-svelte";
    import type { Snippet } from "svelte";
    import Button from "./ui/button/button.svelte";

    interface Props {
        eventId: string;
        name: Snippet;
        organizer: Snippet;
        weeklyRecurrence: Boolean;
        startTime: Snippet;
        endTime: Snippet;
        timezone: Snippet;
    }

    let { eventId, name, organizer, weeklyRecurrence, startTime, endTime, timezone }: Props =
        $props();
</script>

<Card.Root class="w-full max-w-xl min-w-xs">
    <Card.Content class="flex flex-row">
        <div class="flex flex-1 flex-col gap-2">
            <Card.Title>{@render name()}</Card.Title>
            <div class="flex flex-row items-center justify-start gap-2">
                <div class="flex flex-row items-center justify-start text-sm text-muted-foreground">
                    <User class="h-4 w-4" />
                    <p>{@render organizer()}</p>
                </div>
                {#if weeklyRecurrence}
                    <Badge variant="outline">
                        <Repeat class="h-4 w-4" />
                        Weekly
                    </Badge>
                {/if}
            </div>

            <h2 class="mt-2 text-xs text-muted-foreground">AVAILABILITY</h2>
            <div class="justify-centers flex flex-row items-center gap-2">
                <Calendar class="h-4 w-4" />
                <p>
                    {@render startTime()}
                    <span class="text-muted-foreground">~</span>
                    {@render endTime()}
                </p>
            </div>
            <Badge variant="outline">
                <Earth class="h-4 w-4" />
                {@render timezone()}
            </Badge>
        </div>
        <div class="ml-16 flex flex-col items-center justify-center gap-2">
            <Button class="w-16">Edit</Button>
            <Button class="w-16" variant="outline" href={`/${eventId}`}>View</Button>
        </div>
    </Card.Content>
</Card.Root>

<script lang="ts">
    import { page } from "$app/state";
    import * as Accordion from "$lib/components/ui/accordion/index.js";
    import { Badge } from "$lib/components/ui/badge/index.js";
    import { Button } from "$lib/components/ui/button/index.js";
    import * as Card from "$lib/components/ui/card/index.js";

    interface Props {
        code: number;
        title?: string;
        description?: string;
        onRetry?: () => void;
        onGoHome?: () => void;
    }

    let { code, title, description, onRetry, onGoHome }: Props = $props();

    // Comprehensive error configurations
    const errorConfig = {
        400: {
            title: "Bad Request",
            description: "Your request could not be processed.",
            emoji: "⚠️",
            color: "destructive" as const,
            suggestions: "Please check your request and try again."
        },
        401: {
            title: "Unauthorized",
            description: "You need to sign in to access this page.",
            emoji: "🔐",
            color: "destructive" as const,
            suggestions: "Please sign in to continue."
        },
        403: {
            title: "Access Denied",
            description: "You do not have permission to view this page.",
            emoji: "🚫",
            color: "destructive" as const,
            suggestions: "You don't have permission to access this resource."
        },
        404: {
            title: "Page Not Found",
            description: "The page you are looking for does not exist.",
            emoji: "🔍",
            color: "destructive" as const,
            suggestions: "The page you're looking for might have been moved or deleted."
        },
        500: {
            title: "Server Error",
            description: "Something went wrong on our servers.",
            emoji: "⚠️",
            color: "destructive" as const,
            suggestions: "Something went wrong on our end. Please try again later."
        },
        503: {
            title: "Service Unavailable",
            description: "The service is temporarily unavailable.",
            emoji: "🛠️",
            color: "destructive" as const,
            suggestions: "Our service is temporarily down for maintenance. Please try again later."
        },
        default: {
            title: "Unknown Error",
            description: "An unexpected error has occurred.",
            emoji: "❌",
            color: "destructive" as const,
            suggestions: "An unexpected error occurred. Please try again."
        }
    };

    const config = $derived(errorConfig[code as keyof typeof errorConfig] || errorConfig.default);
</script>

<div class="flex h-full items-center justify-center">
    <Card.Root class="w-full max-w-md">
        <Card.Header class="pb-4 text-center">
            <div class="mb-4 text-6xl">{config.emoji}</div>
            <div class="mb-2 flex items-center justify-center gap-2">
                <Badge variant={config.color}>{code}</Badge>
                <h1 class="text-2xl font-bold">{title || config.title}</h1>
            </div>
            <Card.Description class="text-base">
                {description || config.description}
            </Card.Description>
        </Card.Header>

        <Card.Content class="space-y-2">
            <h2 class="text-lg font-semibold">What happened?</h2>
            <p>{config.suggestions}</p>
            <Accordion.Root type="single" class="w-full text-muted-foreground">
                <Accordion.Item value="details">
                    <Accordion.Trigger>Technical Details</Accordion.Trigger>
                    <Accordion.Content>
                        <p>{JSON.stringify(page.error)}</p>
                    </Accordion.Content>
                </Accordion.Item>
            </Accordion.Root>
        </Card.Content>

        <Card.Footer class="flex flex-col gap-2">
            <div class="flex w-full gap-2">
                {#if onRetry}
                    <Button onclick={onRetry} variant="outline" class="flex-1">Try Again</Button>
                {/if}

                {#if onGoHome}
                    <Button onclick={onGoHome} class="flex-1">Go Home</Button>
                {:else}
                    <Button href="/" class="flex-1">Go Home</Button>
                {/if}
            </div>
        </Card.Footer>
    </Card.Root>
</div>

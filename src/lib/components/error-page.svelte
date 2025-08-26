<script lang="ts">
    import { page } from "$app/state";
    import * as Accordion from "$lib/components/ui/accordion/index.js";
    import { Badge } from "$lib/components/ui/badge/index.js";
    import { Button } from "$lib/components/ui/button/index.js";
    import * as Card from "$lib/components/ui/card/index.js";
    import { m } from "$i18n";

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
            title: m.error_400_title(),
            description: m.error_400_description(),
            emoji: "⚠️",
            color: "destructive" as const,
            suggestions: m.error_400_suggestion()
        },
        401: {
            title: m.error_401_title(),
            description: m.error_401_description(),
            emoji: "🔐",
            color: "destructive" as const,
            suggestions: m.error_401_suggestion()
        },
        403: {
            title: m.error_403_title(),
            description: m.error_403_description(),
            emoji: "🚫",
            color: "destructive" as const,
            suggestions: m.error_403_suggestion()
        },
        404: {
            title: m.error_404_title(),
            description: m.error_404_description(),
            emoji: "🔍",
            color: "destructive" as const,
            suggestions: m.error_404_suggestion()
        },
        500: {
            title: m.error_500_title(),
            description: m.error_500_description(),
            emoji: "⚠️",
            color: "destructive" as const,
            suggestions: m.error_500_suggestion()
        },
        503: {
            title: m.error_503_title(),
            description: m.error_503_description(),
            emoji: "🛠️",
            color: "destructive" as const,
            suggestions: m.error_503_suggestion()
        },
        default: {
            title: m.error_default_title(),
            description: m.error_default_description(),
            emoji: "❌",
            color: "destructive" as const,
            suggestions: m.error_default_suggestion()
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
            <h2 class="text-lg font-semibold">{m.error_what_happened()}</h2>
            <p>{config.suggestions}</p>
            <Accordion.Root type="single" class="w-full text-muted-foreground">
                <Accordion.Item value="details">
                    <Accordion.Trigger>{m.error_technical_details()}</Accordion.Trigger>
                    <Accordion.Content>
                        <p>{JSON.stringify(page.error)}</p>
                    </Accordion.Content>
                </Accordion.Item>
            </Accordion.Root>
        </Card.Content>

        <Card.Footer class="flex flex-col gap-2">
            <div class="flex w-full gap-2">
                {#if onRetry}
                    <Button onclick={onRetry} variant="outline" class="flex-1"
                        >{m.error_try_again()}</Button
                    >
                {/if}

                {#if onGoHome}
                    <Button onclick={onGoHome} class="flex-1">{m.error_go_home()}</Button>
                {:else}
                    <Button href="/" class="flex-1">{m.error_go_home()}</Button>
                {/if}
            </div>
        </Card.Footer>
    </Card.Root>
</div>

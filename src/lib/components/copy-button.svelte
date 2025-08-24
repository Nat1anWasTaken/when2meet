<script lang="ts">
    import { Button, type ButtonProps } from "$lib/components/ui/button";
    import * as Tooltip from "$lib/components/ui/tooltip";

    import { copyText } from "$lib/utils";
    import type { Snippet } from "svelte";

    interface Props extends ButtonProps {
        content: string;
        children: Snippet;
        copiedTooltip: Snippet;
        clickToCopyTooltip: Snippet;
    }

    let { content, children, copiedTooltip, clickToCopyTooltip, ...props }: Props = $props();

    let showCopied = $state(false);

    function handleCopy() {
        copyText(content);

        showCopied = true;
    }

    $effect(() => {
        if (!showCopied) return;

        const timeout = setTimeout(() => {
            showCopied = false;
        }, 2000);

        return () => {
            clearTimeout(timeout);
        };
    });
</script>

<Tooltip.Provider>
    <Tooltip.Root delayDuration={0} disableCloseOnTriggerClick={true}>
        <Tooltip.Trigger>
            <Button onclick={handleCopy} {...props}>
                {@render children()}
            </Button>
        </Tooltip.Trigger>
        <Tooltip.Content>
            {#if showCopied}
                {@render copiedTooltip()}
            {:else}
                {@render clickToCopyTooltip()}
            {/if}
        </Tooltip.Content>
    </Tooltip.Root>
</Tooltip.Provider>

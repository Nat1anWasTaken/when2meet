<script lang="ts">
    import { browser } from "$app/environment";
    import { Button } from "$lib/components/ui/button";
    import * as Dialog from "$lib/components/ui/dialog";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import { copyText } from "$lib/utils";
    import { Copy, Share2 } from "lucide-svelte";
    import type { Snippet } from "svelte";
    import { toast } from "svelte-sonner";

    interface Props {
        eventId: string;
        eventName: string;
        children: Snippet;
    }

    let { eventId, eventName, children }: Props = $props();

    let open = $state(false);

    let inviteUrl = $derived.by(() => {
        if (!browser) return "";

        const url = new URL(`/${eventId}`, window.location.origin);
        url.searchParams.set("invited", "true");

        return url.toString();
    });

    async function handleCopyLink() {
        try {
            await copyText(inviteUrl);
            toast.success("Invitation link copied to clipboard!");
        } catch {
            toast.error("Failed to copy link");
        }
    }
</script>

<Dialog.Root bind:open>
    <Dialog.Trigger>
        {@render children()}
    </Dialog.Trigger>
    <Dialog.Content class="sm:max-w-md">
        <Dialog.Header>
            <Dialog.Title class="flex items-center gap-2">
                <Share2 class="h-5 w-5" />
                Share Event
            </Dialog.Title>
            <Dialog.Description>
                Share <span class="font-semibold">{eventName}</span> with others so they can sign their
                available times.
            </Dialog.Description>
        </Dialog.Header>
        <div class="flex flex-col gap-4 py-4">
            <div class="space-y-2">
                <Label for="invite-url">Invitation Link</Label>
                <div class="flex gap-2">
                    <Input
                        id="invite-url"
                        readonly
                        value={inviteUrl}
                        class="flex-1 font-mono text-sm"
                        onfocus={(e) => (e.target as HTMLInputElement).select()}
                    />
                    <Button
                        size="sm"
                        onclick={handleCopyLink}
                        class="shrink-0"
                        aria-label="Copy invitation link"
                    >
                        <Copy class="h-4 w-4" />
                    </Button>
                </div>
            </div>
            <p class="text-sm text-muted-foreground">
                Anyone with this link can view the event and add their availability. Share it with
                participants via email, messaging apps, or social media.
            </p>
        </div>
        <Dialog.Footer class="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
            <Button
                variant="outline"
                onclick={() => {
                    open = false;
                }}
            >
                Close
            </Button>
            <Button onclick={handleCopyLink}>
                <Copy class="h-4 w-4" />
                Copy Link
            </Button>
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root>

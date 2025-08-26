<script lang="ts">
    import { browser } from "$app/environment";
    import { Button } from "$lib/components/ui/button";
    import * as Dialog from "$lib/components/ui/dialog";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import { copyText } from "$lib/utils";
    import IconCopy from "~icons/lucide/copy";
    import IconShare2 from "~icons/lucide/share-2";
    import type { Snippet } from "svelte";
    import { toast } from "svelte-sonner";
    import { m } from "$i18n";

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
            toast.success(m.share_event_success_copied());
        } catch {
            toast.error(m.share_event_error_copy());
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
                <IconShare2 class="h-5 w-5" />
                {m.share_event_dialog_title()}
            </Dialog.Title>
            <Dialog.Description>
                {m.share_event_dialog_description_with_name({ eventName })}
            </Dialog.Description>
        </Dialog.Header>
        <div class="flex flex-col gap-4 py-4">
            <div class="space-y-2">
                <Label for="invite-url">{m.share_event_label_invitation_link()}</Label>
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
                        aria-label={m.share_event_aria_copy_link()}
                    >
                        <IconCopy class="h-4 w-4" />
                    </Button>
                </div>
            </div>
            <p class="text-sm text-muted-foreground">
                {m.share_event_instructions()}
            </p>
        </div>
        <Dialog.Footer class="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
            <Button
                variant="outline"
                onclick={() => {
                    open = false;
                }}
            >
                {m.share_event_button_close()}
            </Button>
            <Button onclick={handleCopyLink}>
                <IconCopy class="h-4 w-4" />
                {m.share_event_button_copy_link()}
            </Button>
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root>

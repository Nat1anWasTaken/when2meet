<script lang="ts">
    import { authClient } from "$lib/auth-client";
    import { page } from "$app/state";
    import { Button } from "$lib/components/ui/button";
    import * as Card from "$lib/components/ui/card";
    import { m } from "$lib/paraglide/messages";
    import { onMount } from "svelte";
    import ShieldCheck from "~icons/lucide/shield-check";

    const params = page.url.searchParams;
    const clientId = params.get("client_id") ?? "";
    const scopes = (params.get("scope") ?? "")
        .split(/\s+/)
        .filter(Boolean)
        .filter((scope) => !["openid", "profile", "offline_access"].includes(scope));

    let clientName = $state("");
    let loading = $state(true);
    let submitting = $state(false);
    let error = $state("");

    const scopeDescriptions: Record<string, () => string> = {
        "events:read": m.oauth_scope_events_read,
        "events:write": m.oauth_scope_events_write,
        "availability:write": m.oauth_scope_availability_write
    };

    onMount(async () => {
        if (!clientId) {
            error = m.oauth_invalid_request();
            loading = false;
            return;
        }
        const result = await authClient.oauth2.publicClient({ query: { client_id: clientId } });
        if (result.error) error = result.error.message ?? m.oauth_client_load_failed();
        else clientName = result.data?.client_name ?? clientId;
        loading = false;
    });

    async function decide(accept: boolean) {
        submitting = true;
        error = "";
        const result = await authClient.oauth2.consent({
            accept,
            scope: params.get("scope") ?? undefined
        });
        if (result.error) {
            error = result.error.message ?? m.oauth_consent_failed();
            submitting = false;
        }
    }
</script>

<svelte:head>
    <title>{m.oauth_consent_page_title()}</title>
</svelte:head>

<div class="flex min-h-full items-center justify-center p-4">
    <Card.Root class="w-full max-w-lg">
        <Card.Header class="text-center">
            <div
                class="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10"
            >
                <ShieldCheck class="h-6 w-6 text-primary" />
            </div>
            <Card.Title>{m.oauth_consent_title()}</Card.Title>
            <Card.Description>
                {#if loading}
                    {m.oauth_loading_client()}
                {:else}
                    {m.oauth_consent_description({ client: clientName || clientId })}
                {/if}
            </Card.Description>
        </Card.Header>
        <Card.Content class="space-y-4">
            <div class="rounded-lg border p-4">
                <p class="mb-3 text-sm font-medium">{m.oauth_permissions_title()}</p>
                <ul class="space-y-3">
                    {#each scopes as scope (scope)}
                        <li class="flex gap-3 text-sm">
                            <span class="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"></span>
                            <span>{scopeDescriptions[scope]?.() ?? scope}</span>
                        </li>
                    {/each}
                </ul>
            </div>
            <p class="text-xs text-muted-foreground">{m.oauth_no_delete_notice()}</p>
            {#if error}
                <p class="text-sm text-destructive" role="alert">{error}</p>
            {/if}
        </Card.Content>
        <Card.Footer class="grid grid-cols-2 gap-3">
            <Button
                variant="outline"
                disabled={loading || submitting || !!error}
                onclick={() => decide(false)}
            >
                {m.oauth_deny()}
            </Button>
            <Button disabled={loading || submitting || !!error} onclick={() => decide(true)}>
                {submitting ? m.oauth_authorizing() : m.oauth_allow()}
            </Button>
        </Card.Footer>
    </Card.Root>
</div>

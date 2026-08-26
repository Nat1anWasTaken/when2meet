<script lang="ts">
    import { authClient } from "$lib/auth-client";
    import AuthDialog from "$lib/components/auth-dialog.svelte";
    import { Button } from "$lib/components/ui/button";
    import * as Card from "$lib/components/ui/card";
    import { m } from "$lib/paraglide/messages";
    import { onMount } from "svelte";
    import { toast } from "svelte-sonner";
    import Cable from "~icons/lucide/cable";
    import Trash2 from "~icons/lucide/trash-2";

    type Connection = {
        id: string;
        clientId: string;
        clientName: string;
        scopes: string[];
        updatedAt: Date | string;
    };

    const session = authClient.useSession();
    let connections = $state<Connection[]>([]);
    let loading = $state(true);
    let revoking = $state<string | null>(null);
    let error = $state("");

    onMount(loadConnections);

    async function loadConnections() {
        loading = true;
        error = "";
        const result = await authClient.oauth2.getConsents();
        if (result.error) {
            error = result.error.message ?? m.connections_load_failed();
            loading = false;
            return;
        }
        connections = await Promise.all(
            (result.data ?? []).map(async (consent) => {
                const client = await authClient.oauth2.publicClient({
                    query: { client_id: consent.clientId }
                });
                return {
                    id: consent.id,
                    clientId: consent.clientId,
                    clientName: client.data?.client_name ?? consent.clientId,
                    scopes: consent.scopes,
                    updatedAt: consent.updatedAt
                };
            })
        );
        loading = false;
    }

    async function revoke(connection: Connection) {
        revoking = connection.id;
        const response = await fetch("/api/connections/revoke", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ id: connection.id })
        });
        if (!response.ok) toast.error(m.connections_revoke_failed());
        else {
            connections = connections.filter((item) => item.id !== connection.id);
            toast.success(m.connections_revoked({ client: connection.clientName }));
        }
        revoking = null;
    }
</script>

<svelte:head>
    <title>{m.connections_page_title()}</title>
</svelte:head>

<div class="mx-auto w-full max-w-3xl p-4 py-8">
    <div class="mb-6">
        <h1 class="text-3xl font-bold">{m.connections_title()}</h1>
        <p class="mt-1 text-muted-foreground">{m.connections_description()}</p>
    </div>

    {#if $session.isPending || loading}
        <p class="text-muted-foreground">{m.connections_loading()}</p>
    {:else if !$session.data?.user}
        <Card.Root>
            <Card.Header>
                <Card.Title>{m.connections_sign_in_title()}</Card.Title>
                <Card.Description>{m.connections_sign_in_description()}</Card.Description>
            </Card.Header>
            <Card.Footer><AuthDialog triggerLabel={m.connections_sign_in()} /></Card.Footer>
        </Card.Root>
    {:else if error}
        <p class="text-destructive" role="alert">{error}</p>
    {:else if connections.length === 0}
        <Card.Root>
            <Card.Content class="flex flex-col items-center py-12 text-center">
                <Cable class="mb-4 h-10 w-10 text-muted-foreground" />
                <h2 class="font-semibold">{m.connections_empty_title()}</h2>
                <p class="mt-1 text-sm text-muted-foreground">
                    {m.connections_empty_description()}
                </p>
            </Card.Content>
        </Card.Root>
    {:else}
        <div class="space-y-3">
            {#each connections as connection (connection.id)}
                <Card.Root>
                    <Card.Header>
                        <Card.Title class="text-lg">{connection.clientName}</Card.Title>
                        <Card.Description>
                            {m.connections_last_authorized({
                                date: new Date(connection.updatedAt).toLocaleDateString()
                            })}
                        </Card.Description>
                    </Card.Header>
                    <Card.Content>
                        <div class="flex flex-wrap gap-2">
                            {#each connection.scopes.filter((scope) => !["openid", "profile", "offline_access"].includes(scope)) as scope (scope)}
                                <span class="rounded-full bg-muted px-2.5 py-1 text-xs"
                                    >{scope}</span
                                >
                            {/each}
                        </div>
                    </Card.Content>
                    <Card.Footer>
                        <Button
                            variant="destructive"
                            size="sm"
                            disabled={revoking === connection.id}
                            onclick={() => revoke(connection)}
                        >
                            <Trash2 class="h-4 w-4" />
                            {revoking === connection.id
                                ? m.connections_revoking()
                                : m.connections_revoke()}
                        </Button>
                    </Card.Footer>
                </Card.Root>
            {/each}
        </div>
    {/if}
</div>

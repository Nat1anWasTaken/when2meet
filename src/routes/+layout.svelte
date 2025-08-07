<script lang="ts">
    import "../app.css";
    import favicon from "$lib/assets/favicon.svg";
    import { ModeWatcher } from "mode-watcher";
    import Navbar from "$lib/components/navbar.svelte";
    import { Toaster } from "$lib/components/ui/sonner";
    import { browser } from "$app/environment";
    import { QueryClient, QueryClientProvider } from "@tanstack/svelte-query";

    let { children } = $props();

    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                enabled: browser
            }
        }
    });
</script>

<svelte:head>
    <link rel="icon" href={favicon} />
</svelte:head>

<QueryClientProvider client={queryClient}>
    <ModeWatcher />
    <Toaster />
    <div class="flex h-screen min-h-screen flex-col">
        <Navbar />
        <main class="w-full flex-1 overflow-auto">
            {@render children?.()}
        </main>
    </div>
</QueryClientProvider>

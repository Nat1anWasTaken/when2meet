<script lang="ts">
    import "../app.css";
    import favicon from "$lib/assets/favicon.svg";
    import { ModeWatcher } from "mode-watcher";
    import Navbar from "$lib/components/navbar.svelte";
    import { Toaster } from "$lib/components/ui/sonner";
    import { browser } from "$app/environment";

    let { children } = $props();
</script>

<svelte:head>
    <link rel="icon" href={favicon} />
</svelte:head>

<ModeWatcher />
<Toaster />
<div class="flex h-screen min-h-screen flex-col">
    <Navbar />
    <main class="w-full flex-1 overflow-auto">
        {@render children?.()}
    </main>
</div>

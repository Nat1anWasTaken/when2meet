<script lang="ts">
    import "../app.css";
    import favicon from "$lib/assets/favicon.svg";
    import { ModeWatcher } from "mode-watcher";
    import Navbar from "$lib/components/navbar.svelte";

    let { children } = $props();
</script>

<svelte:head>
    <link rel="icon" href={favicon} />
</svelte:head>

<ModeWatcher />
<div class="flex h-screen flex-col">
    <Navbar />
    <main class="w-full flex-1 overflow-auto">
        {@render children?.()}
    </main>
</div>

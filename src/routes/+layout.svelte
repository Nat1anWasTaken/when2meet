<script lang="ts">
    import { afterNavigate } from "$app/navigation";
    import "../app.css";
    import favicon from "$lib/assets/favicon.svg";
    import { ModeWatcher } from "mode-watcher";
    import Navbar from "$lib/components/navbar.svelte";
    import { Toaster } from "$lib/components/ui/sonner";
    import { onMount } from "svelte";

    let { children } = $props();

    const MOBILE_BREAKPOINT = "(max-width: 767px)";
    const NAVBAR_HEIGHT = 64;
    const TOP_REVEAL_OFFSET = 8;
    const HIDE_DISTANCE = 24;
    const REVEAL_DISTANCE = 16;

    let mainElement = $state<HTMLElement | null>(null);
    let isMobile = $state(false);
    let mobileNavbarHidden = $state(false);
    let lastScrollTop = 0;
    let accumulatedDistance = 0;
    let scrollDirection = 0;

    function resetScrollTracking() {
        lastScrollTop = Math.max(0, mainElement?.scrollTop ?? 0);
        accumulatedDistance = 0;
        scrollDirection = 0;
    }

    function handleMainScroll() {
        if (!mainElement || !isMobile) return;

        const currentScrollTop = Math.max(0, mainElement.scrollTop);
        const delta = currentScrollTop - lastScrollTop;
        lastScrollTop = currentScrollTop;

        if (currentScrollTop <= TOP_REVEAL_OFFSET) {
            mobileNavbarHidden = false;
            accumulatedDistance = 0;
            scrollDirection = 0;
            return;
        }

        if (delta === 0) return;

        const nextDirection = Math.sign(delta);
        if (nextDirection !== scrollDirection) {
            scrollDirection = nextDirection;
            accumulatedDistance = 0;
        }
        accumulatedDistance += Math.abs(delta);

        if (
            nextDirection > 0 &&
            currentScrollTop >= NAVBAR_HEIGHT &&
            accumulatedDistance >= HIDE_DISTANCE
        ) {
            mobileNavbarHidden = true;
            accumulatedDistance = 0;
        } else if (nextDirection < 0 && accumulatedDistance >= REVEAL_DISTANCE) {
            mobileNavbarHidden = false;
            accumulatedDistance = 0;
        }
    }

    onMount(() => {
        const mobileQuery = window.matchMedia(MOBILE_BREAKPOINT);

        function handleBreakpointChange() {
            isMobile = mobileQuery.matches;
            if (!isMobile) mobileNavbarHidden = false;
            resetScrollTracking();
        }

        handleBreakpointChange();
        mobileQuery.addEventListener("change", handleBreakpointChange);

        return () => mobileQuery.removeEventListener("change", handleBreakpointChange);
    });

    afterNavigate(() => {
        mobileNavbarHidden = false;
        requestAnimationFrame(resetScrollTracking);
    });
</script>

<svelte:head>
    <link rel="icon" href={favicon} />
</svelte:head>

<ModeWatcher />
<Toaster />
<div class="relative flex h-screen min-h-screen flex-col">
    <Navbar mobileHidden={mobileNavbarHidden} />
    <main
        bind:this={mainElement}
        class={[
            "w-full flex-1 overflow-auto md:[--mobile-navbar-offset:0px]",
            mobileNavbarHidden ? "[--mobile-navbar-offset:0px]" : "[--mobile-navbar-offset:64px]"
        ]}
        onscroll={handleMainScroll}
    >
        <div class="h-16 md:hidden" aria-hidden="true"></div>
        {@render children?.()}
    </main>
</div>

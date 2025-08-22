<script lang="ts">
    import TimeSelector from "$lib/components/time-selector.svelte";
    import type { PageProps } from "./$types";

    let { data }: PageProps = $props();
</script>

<div class="flex h-full w-full items-center justify-center p-4">
    <div class="h-full w-full max-w-4xl">
        <TimeSelector days={7} />
    </div>
</div>

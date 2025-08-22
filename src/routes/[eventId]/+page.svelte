<script lang="ts">
    import TimeSelector from "$lib/components/time-selector.svelte";
    import { daysBetween } from "$lib/utils";
    import type { PageProps } from "./$types";

    let { data }: PageProps = $props();

    const days = daysBetween(data.availableTime.startTime, data.availableTime.endTime);

    let selectedTimes = $state<{ startTime: Date; endTime: Date }[]>([]);

    const handleSelectionChange = (selections: { startTime: Date; endTime: Date }[]) => {
        selectedTimes = selections;
        console.log("Selected times:", selections);
    };
</script>

<div class="flex h-full w-full items-center justify-center p-4">
    <div class="h-full w-full max-w-6xl">
        <div>
            <TimeSelector {days} class="h-full" />
        </div>
    </div>
</div>

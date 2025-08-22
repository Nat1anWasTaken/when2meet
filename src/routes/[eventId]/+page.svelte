<script lang="ts">
    import TimeSelector from "$lib/components/time-selector.svelte";
    import type { PageProps } from "./$types";

    let { data }: PageProps = $props();

    // Mock data for testing
    const mockParticipants = [
        {
            id: 1,
            username: "Alice",
            timeSelection: [
                {
                    startTime: new Date(2024, 7, 12, 14, 0), // Aug 12, 2:00 PM
                    endTime: new Date(2024, 7, 12, 18, 0) // Aug 12, 6:00 PM
                },
                {
                    startTime: new Date(2024, 7, 13, 10, 0), // Aug 13, 10:00 AM
                    endTime: new Date(2024, 7, 13, 12, 0) // Aug 13, 12:00 PM
                }
            ]
        },
        {
            id: 2,
            username: "Bob",
            timeSelection: [
                {
                    startTime: new Date(2024, 7, 12, 15, 0), // Aug 12, 3:00 PM
                    endTime: new Date(2024, 7, 12, 17, 0) // Aug 12, 5:00 PM
                },
                {
                    startTime: new Date(2024, 7, 14, 9, 0), // Aug 14, 9:00 AM
                    endTime: new Date(2024, 7, 14, 11, 0) // Aug 14, 11:00 AM
                }
            ]
        }
    ];

    const eventStartDate = new Date(2024, 7, 12); // Aug 12, 2024
    const eventEndDate = new Date(2024, 7, 18); // Aug 18, 2024

    let selectedTimes = $state<{ startTime: Date; endTime: Date }[]>([]);

    const handleSelectionChange = (selections: { startTime: Date; endTime: Date }[]) => {
        selectedTimes = selections;
        console.log("Selected times:", selections);
    };
</script>

<div class="flex h-full w-full items-center justify-center p-4">
    <div class="h-full w-full max-w-6xl">
        <TimeSelector
            {eventStartDate}
            {eventEndDate}
            {selectedTimes}
            onSelectionChange={handleSelectionChange}
            class="h-full"
        />
    </div>
</div>

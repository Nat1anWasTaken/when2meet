<script lang="ts">
    import type { PageProps } from "./$types";
    import { getEvents } from "$lib/api/events.remote";

    let { data }: PageProps = $props();
</script>

{#await getEvents()}
    <p>loadings</p>
{:then events}
    <ul>
        {#each events as event}
            <li>
                {event.name}
            </li>
        {/each}
    </ul>
{:catch error}
    <p>Error loading events: {error}</p>
{/await}

<script lang="ts">
    import { createQuery } from "@tanstack/svelte-query";
    import type { PageProps } from "./$types";

    let { data }: PageProps = $props();

    const eventsQuery = createQuery();
</script>

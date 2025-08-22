<script lang="ts">
    import type { Snippet } from "svelte";

    interface Props {
        children?: Snippet;
        class?: string;
        days?: number;
    }

    let { children, class: className, days = 7 }: Props = $props();
</script>

<div
    class={`grid grid-rows-48 gap-1`}
    style={`grid-template-columns: repeat(${days}, minmax(0, 1fr));`}
>
    {#each { length: 24 * days } as _, i}
        <div class="flex min-h-[40px] items-center justify-center border border-gray-300 p-2">
            {i}
        </div>
    {/each}
</div>

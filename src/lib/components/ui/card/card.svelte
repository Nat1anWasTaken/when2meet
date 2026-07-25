<script lang="ts">
    import { cn, type WithElementRef } from "$lib/utils.js";
    import type { HTMLAttributes } from "svelte/elements";

    let {
        ref = $bindable(null),
        class: className,
        children,
        ...restProps
    }: WithElementRef<HTMLAttributes<HTMLDivElement>> = $props();
</script>

<div
    bind:this={ref}
    data-slot="card"
    class={cn(
        "flex flex-col gap-6 rounded-xl border border-accent bg-card py-6 text-card-foreground shadow-sm",
        className
    )}
    {...restProps}
>
    {@render children?.()}
</div>

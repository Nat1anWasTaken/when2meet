<script lang="ts">
    import * as Avatar from "$lib/components/ui/avatar";
    import { cn } from "$lib/utils";

    interface Props {
        name: string;
        image?: string | null;
        size?: "sm" | "md" | "lg" | "xl" | "auto";
        class?: string;
    }

    let { name, image, size = "md", class: className }: Props = $props();

    const sizeClasses = {
        sm: "size-6",
        md: "size-8",
        lg: "size-12",
        xl: "size-16",
        auto: "w-full h-full"
    };

    const textSizeClasses = {
        sm: "text-xs",
        md: "text-sm",
        lg: "text-base",
        xl: "text-lg",
        auto: "text-sm"
    };
</script>

<div class={cn("flex items-center gap-2 rounded-md bg-muted pr-3", className)}>
    <Avatar.Root class={sizeClasses[size]}>
        <Avatar.Image src={image} alt={name} />
        <Avatar.Fallback
            class="bg-primary {textSizeClasses[size]} font-medium text-primary-foreground"
        >
            {name.charAt(0).toUpperCase()}
        </Avatar.Fallback>
    </Avatar.Root>
    <span class="{textSizeClasses[size]} font-medium">
        {name}
    </span>
</div>

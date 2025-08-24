<script lang="ts">
    import { goto } from "$app/navigation";
    import { authClient } from "$lib/auth-client";
    import * as Avatar from "$lib/components/ui/avatar";
    import { Button } from "$lib/components/ui/button";
    import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
    import { toast } from "svelte-sonner";
    import IconCalendar from "~icons/lucide/calendar";
    import IconLogOut from "~icons/lucide/log-out";

    const session = authClient.useSession();

    const handleLogout = async () => {
        try {
            toast.info("Logging out...");
            await authClient.signOut();
            toast.success("Logged out successfully");
            await goto("/");
        } catch {
            toast.error("Failed to logout");
        }
    };

    const handleEvents = () => {
        goto("/events");
    };

    const getUserInitials = (name: string | null | undefined) => {
        if (!name) return "U";
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .substring(0, 2)
            .toUpperCase();
    };
</script>

{#if $session.data?.user && !$session.isPending}
    <DropdownMenu.Root>
        <DropdownMenu.Trigger>
            <Avatar.Root class="h-8 w-8">
                <Avatar.Image
                    src={$session.data.user.image}
                    alt={$session.data.user.name || "User"}
                />
                <Avatar.Fallback>{getUserInitials($session.data.user.name)}</Avatar.Fallback>
            </Avatar.Root>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content class="w-56" align="end">
            <DropdownMenu.Label class="font-normal">
                <div class="flex flex-col space-y-1">
                    <p class="text-sm leading-none font-medium">
                        {$session.data.user.name || "User"}
                    </p>
                    <p class="text-xs leading-none text-muted-foreground">
                        {$session.data.user.email}
                    </p>
                </div>
            </DropdownMenu.Label>
            <DropdownMenu.Separator />
            <DropdownMenu.Item onclick={handleEvents}>
                <IconCalendar class="mr-2 h-4 w-4" />
                <span>My Events</span>
            </DropdownMenu.Item>
            <DropdownMenu.Separator />
            <DropdownMenu.Item onclick={handleLogout} variant="destructive">
                <IconLogOut class="mr-2 h-4 w-4" />
                <span>Log out</span>
            </DropdownMenu.Item>
        </DropdownMenu.Content>
    </DropdownMenu.Root>
{:else if $session.isPending}
    <div class="h-8 w-8 animate-pulse rounded-full bg-muted"></div>
{:else}
    <div class="flex gap-2">
        <Button variant="ghost" size="sm" onclick={() => goto("/login")}>Login</Button>
        <Button size="sm" onclick={() => goto("/register")}>Sign Up</Button>
    </div>
{/if}

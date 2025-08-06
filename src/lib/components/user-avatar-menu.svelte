<script lang="ts">
    import { goto } from "$app/navigation";
    import { authClient } from "$lib/auth-client";
    import * as Avatar from "$lib/components/ui/avatar";
    import { Button } from "$lib/components/ui/button";
    import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
    import { LogOut, User } from "lucide-svelte";
    import { toast } from "svelte-sonner";

    const session = authClient.useSession();

    const handleLogout = async () => {
        try {
            toast.info("Logging out...");
            await authClient.signOut();
            toast.success("Logged out successfully");
            goto("/");
        } catch {
            toast.error("Failed to logout");
        }
    };

    const handleProfile = () => {
        goto("/profile");
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
        <DropdownMenu.Trigger asChild let:builder>
            <Button builders={[builder]} variant="ghost" class="relative h-8 w-8 rounded-full">
                <Avatar.Root class="h-8 w-8">
                    <Avatar.Image
                        src={$session.data.user.image}
                        alt={$session.data.user.name || "User"}
                    />
                    <Avatar.Fallback>{getUserInitials($session.data.user.name)}</Avatar.Fallback>
                </Avatar.Root>
            </Button>
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
            <DropdownMenu.Item onclick={handleProfile}>
                <User class="mr-2 h-4 w-4" />
                <span>Profile</span>
            </DropdownMenu.Item>
            <DropdownMenu.Separator />
            <DropdownMenu.Item onclick={handleLogout}>
                <LogOut class="mr-2 h-4 w-4" />
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

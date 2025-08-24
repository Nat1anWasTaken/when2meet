<script>
    import ModeSwitch from "./mode-switch.svelte";
    import UserAvatarMenu from "./user-avatar-menu.svelte";
</script>

<div class="flex h-16 flex-row items-center justify-between px-4">
    <div class="flex flex-row items-center gap-2">
        <h1 class="text-lg font-bold">
            <a href="/">
                when2meet<span class="text-primary">.app</span>
            </a>
        </h1>
        <a href="/about" class="hidden md:block">About</a>
    </div>
    <div class="flex flex-row items-center gap-2">
        <ModeSwitch />
        <UserAvatarMenu />
    </div>
</div>

<script>
    import { m } from "$i18n";
    import RiGithubFill from "~icons/ri/github-fill";
    import LanguageSelect from "./language-select.svelte";
    import ModeSwitch from "./mode-switch.svelte";
    import { Button } from "./ui/button";
    import UserAvatarMenu from "./user-avatar-menu.svelte";
</script>

<div class="flex h-16 flex-row items-center justify-between px-4">
    <div class="flex flex-row items-center gap-2">
        <h1 class="text-lg font-bold">
            <a href="/">
                {m.brand_name()}<span class="text-primary">{m.brand_extension()}</span>
            </a>
        </h1>
        <a href="/about" class="hidden md:block">{m.nav_about()}</a>
    </div>
    <div class="flex flex-row items-center gap-2">
        <LanguageSelect />
        <Button href="https://github.com/Nat1anWasTaken/when2meet" variant="ghost" size="icon">
            <RiGithubFill />
        </Button>
        <ModeSwitch />
        <UserAvatarMenu />
    </div>
</div>

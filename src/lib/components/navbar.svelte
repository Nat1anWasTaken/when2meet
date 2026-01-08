<script>
    import { m } from "$i18n";
    import RiGithubFill from "~icons/ri/github-fill";
    import LanguageSelect from "./language-select.svelte";
    import ModeSwitch from "./mode-switch.svelte";
    import { Button } from "./ui/button";
    import UserAvatarMenu from "./user-avatar-menu.svelte";
    import { localizeHref, setLocale, locales } from "$lib/paraglide/runtime";
    import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
    import Menu from "~icons/lucide/menu";
    import Languages from "~icons/lucide/languages";
    import Info from "~icons/lucide/info";
    import Sun from "~icons/lucide/sun";
    import Moon from "~icons/lucide/moon";
    import { toggleMode } from "mode-watcher";
    import { goto } from "$app/navigation";

    const availableLanguages = {
        en: "🇺🇸 English",
        "zh-hant-tw": "🇹🇼 中文 (繁體)"
    };
</script>

<div class="flex h-16 flex-row items-center justify-between px-4">
    <div class="flex flex-row items-center gap-2">
        <h1 class="text-lg font-bold">
            <a href={localizeHref("/")}>
                {m.brand_name()}<span class="text-primary">{m.brand_extension()}</span>
            </a>
        </h1>
        <a href={localizeHref("/about")} class="hidden md:block">{m.nav_about()}</a>
    </div>

    <!-- Desktop Menu -->
    <div class="hidden flex-row items-center gap-2 md:flex">
        <LanguageSelect />
        <Button href="https://github.com/Nat1anWasTaken/when2meet" variant="ghost" size="icon">
            <RiGithubFill />
        </Button>
        <ModeSwitch />
        <UserAvatarMenu />
    </div>

    <!-- Mobile Menu -->
    <div class="flex flex-row items-center gap-2 md:hidden">
        <UserAvatarMenu />
        <DropdownMenu.Root>
            <DropdownMenu.Trigger>
                <Button variant="ghost" size="icon">
                    <Menu />
                </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content align="end">
                <DropdownMenu.Item onclick={() => goto(localizeHref("/about"))}>
                    <Info class="mr-2 h-4 w-4" />
                    {m.nav_about()}
                </DropdownMenu.Item>
                <DropdownMenu.Item
                    onclick={() =>
                        window.open("https://github.com/Nat1anWasTaken/when2meet", "_blank")}
                >
                    <RiGithubFill class="mr-2 h-4 w-4" />
                    GitHub
                </DropdownMenu.Item>
                <DropdownMenu.Item onclick={toggleMode}>
                    <Sun
                        class="mr-2 h-4 w-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90"
                    />
                    <Moon
                        class="absolute mr-2 h-4 w-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0"
                    />
                    {m.mode_switch_toggle_theme()}
                </DropdownMenu.Item>

                <DropdownMenu.Separator />
                <DropdownMenu.Sub>
                    <DropdownMenu.SubTrigger>
                        <Languages class="mr-2 h-4 w-4" />
                        <span>Language</span>
                    </DropdownMenu.SubTrigger>
                    <DropdownMenu.SubContent>
                        {#each locales as lang}
                            <DropdownMenu.Item onclick={() => setLocale(lang)}>
                                {availableLanguages[lang]}
                            </DropdownMenu.Item>
                        {/each}
                    </DropdownMenu.SubContent>
                </DropdownMenu.Sub>
            </DropdownMenu.Content>
        </DropdownMenu.Root>
    </div>
</div>

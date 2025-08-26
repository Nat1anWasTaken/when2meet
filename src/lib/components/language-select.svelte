<script lang="ts">
    import { m } from "$i18n";
    import * as Select from "$lib/components/ui/select";
    import { getLocale, locales, setLocale } from "$lib/paraglide/runtime";

    type SupportedLanguages = (typeof locales)[number];
    const availableLanguages: Record<SupportedLanguages, string> = {
        en: "🇺🇸 English",
        "zh-hant-tw": "🇹🇼 中文 (繁體)"
    };

    interface Props {
        selectedLanguage?: SupportedLanguages;
    }

    let { selectedLanguage = $bindable(getLocale()) }: Props = $props();

    function handleLanguageChange(newLang: string) {
        const language = newLang as SupportedLanguages;
        selectedLanguage = language;
        setLocale(language);
    }
</script>

<Select.Root type="single" bind:value={selectedLanguage} onValueChange={handleLanguageChange}>
    <Select.Trigger>
        {selectedLanguage ? availableLanguages[selectedLanguage] : m.navbar_language_select()}
    </Select.Trigger>
    <Select.Content>
        {#each Object.entries(availableLanguages) as [lang, label] (lang)}
            <Select.Item value={lang}>
                {label}
            </Select.Item>
        {/each}
    </Select.Content>
</Select.Root>

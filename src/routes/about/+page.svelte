<script>
    import { m } from "$lib/paraglide/messages";
    import IconHammer from "~icons/lucide/hammer";
</script>

<svelte:head>
    <title>{m.about_page_title()}</title>
    <meta
        name="description"
        content={m.about_meta_description()}
    />

    <!-- OpenGraph meta tags -->
    <meta property="og:type" content="website" />
    <meta property="og:title" content={m.about_page_title()} />
    <meta
        property="og:description"
        content={m.about_meta_description()}
    />
    <meta property="og:url" content="https://when2meet.app/about" />
    <meta property="og:site_name" content="when2meet.app" />
    <meta property="og:locale" content="en_US" />

    <!-- Twitter Card meta tags -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content={m.about_page_title()} />
    <meta
        name="twitter:description"
        content={m.about_meta_description()}
    />
    <meta name="twitter:url" content="https://when2meet.app/about" />
    <meta name="twitter:site" content="@when2meetapp" />

    <!-- Additional meta tags -->
    <meta name="robots" content="index, follow" />
</svelte:head>

<div class="flex h-full w-full flex-col items-center justify-center">
    <div
        class="flex min-h-[400px] w-full flex-col items-center justify-center space-y-6 text-center"
    >
        <div class="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <IconHammer class="h-8 w-8 text-muted-foreground" />
        </div>

        <div>
            <h2 class="text-2xl font-semibold">{m.about_under_construction()}</h2>
        </div>
    </div>
</div>

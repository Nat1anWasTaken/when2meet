<script lang="ts">
    import NewEventDialog from "$lib/components/new-event-dialog.svelte";
    import Button from "$lib/components/ui/button/button.svelte";
    import { m } from "$lib/paraglide/messages";
</script>

<svelte:head>
    <title>{m.home_meta_title()}</title>
    <link rel="canonical" href="https://when2meet.app/" />

    <meta name="description" content={m.home_meta_description()} />

    <!-- OpenGraph -->
    <meta property="og:type" content="website" />
    <meta property="og:title" content={m.home_meta_title()} />
    <meta property="og:description" content={m.home_meta_description()} />
    <meta property="og:url" content="https://when2meet.app/" />
    <meta property="og:site_name" content="when2meet.app" />
    <meta property="og:locale" content="en_US" />
    <meta property="og:image" content="https://when2meet.app/thumbnail.png?v=2" />
    <meta property="og:image:secure_url" content="https://when2meet.app/thumbnail.png?v=2" />
    <meta property="og:image:alt" content={m.home_meta_title()} />
    <meta property="og:image:type" content="image/png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content={m.home_meta_title()} />
    <meta name="twitter:description" content={m.home_meta_description()} />
    <meta name="twitter:url" content="https://when2meet.app/" />
    <meta name="twitter:site" content="@when2meetapp" />
    <meta name="twitter:image" content="https://when2meet.app/thumbnail.png?v=2" />

    <meta name="robots" content="index,follow" />
</svelte:head>

<section class="flex h-full items-center justify-center px-6 text-center">
    <div class="max-w-3xl">
        <h1 class="text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl">
            {m.brand_name()}<span class="text-primary">{m.brand_extension()}</span>
        </h1>
        <p class="mt-6 text-base text-muted-foreground sm:text-lg">
            {m.home_description()}
        </p>
        <div class="mt-8 flex flex-row justify-center gap-2">
            <Button size="lg" variant="outline" href="/about">{m.home_learn_more()}</Button>
            <NewEventDialog redirect={true}>
                <Button size="lg">{m.home_organize_new_event()}</Button>
            </NewEventDialog>
        </div>
    </div>
</section>

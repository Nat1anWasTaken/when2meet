<script lang="ts">
    import NewEventDialog from "$lib/components/new-event-dialog.svelte";
    import Button from "$lib/components/ui/button/button.svelte";
</script>

<svelte:head>
    <title>when2meet.app - Find meeting times that work for everyone, fast.</title>
    <meta
        name="description"
        content="Find meeting times that work for everyone, fast. Create events and let participants select their availability to find the best meeting times."
    />

    <!-- OpenGraph meta tags -->
    <meta property="og:type" content="website" />
    <meta
        property="og:title"
        content="when2meet.app - Find meeting times that work for everyone, fast."
    />
    <meta
        property="og:description"
        content="Find meeting times that work for everyone, fast. Create events and let participants select their availability to find the best meeting times."
    />
    <meta property="og:url" content="https://when2meet.app" />
    <meta property="og:site_name" content="when2meet.app" />
    <meta property="og:locale" content="en_US" />

    <!-- Twitter Card meta tags -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta
        name="twitter:title"
        content="when2meet.app - Find meeting times that work for everyone, fast."
    />
    <meta
        name="twitter:description"
        content="Find meeting times that work for everyone, fast. Create events and let participants select their availability to find the best meeting times."
    />
    <meta name="twitter:url" content="https://when2meet.app" />
    <meta name="twitter:site" content="@when2meetapp" />

    <!-- Additional meta tags -->
    <meta name="robots" content="index, follow" />
</svelte:head>

<section class="flex h-full items-center justify-center px-6 text-center">
    <div class="max-w-3xl">
        <h1 class="text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl">
            when2meet<span class="text-primary">.app</span>
        </h1>
        <p class="mt-6 text-base text-muted-foreground sm:text-lg">
            Find meeting times that work for everyone, fast.
        </p>
        <div class="mt-8 flex flex-row justify-center gap-2">
            <Button size="lg" variant="outline" href="/about">what is this?</Button>
            <NewEventDialog redirect={true}>
                <Button size="lg">organize new event</Button>
            </NewEventDialog>
        </div>
    </div>
</section>

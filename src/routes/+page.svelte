<script lang="ts">
    import Button from "$lib/components/ui/button/button.svelte";
</script>

<section class="flex h-full items-center justify-center px-6 text-center">
    <div class="max-w-3xl">
        <h1 class="text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl">
            when2meet<span class="text-primary">.app</span>
        </h1>
        <p class="mt-6 text-base text-muted-foreground sm:text-lg">
            Find meeting times that work for everyone, fast.
        </p>
        <div class="mt-8">
            <a href="/events">
                <Button size="lg">organize new event</Button>
            </a>
        </div>
    </div>
</section>

<script lang="ts">
    import { authClient } from "$lib/auth-client";
    import { Button } from "$lib/components/ui/button/index.js";
    import * as Card from "$lib/components/ui/card/index.js";
    import { toast } from "svelte-sonner";
    import RiGithubFill from "~icons/ri/github-fill";
    import RiGoogleFill from "~icons/ri/google-fill";
    import { m } from "$i18n";

    interface Props {
        redirectTo?: string;
    }

    const { redirectTo }: Props = $props();

    const handleGoogleSignIn = async () => {
        toast.info(m.login_signing_in_google());

        try {
            await authClient.signIn.social({
                provider: "google",
                callbackURL: redirectTo || "/"
            });
        } catch (error) {
            toast.error(m.login_google_failed());
            console.error("Google sign in error:", error);
        }
    };

    const handleGithubSignIn = async () => {
        toast.info(m.login_signing_in_github());

        try {
            await authClient.signIn.social({
                provider: "github",
                callbackURL: redirectTo || "/"
            });
        } catch (error) {
            toast.error(m.login_github_failed());
            console.error("GitHub sign in error:", error);
        }
    };
</script>

<Card.Root class="mx-auto w-full max-w-sm">
    <Card.Header>
        <Card.Title class="text-2xl">{m.login_title()}</Card.Title>
        <Card.Description>{m.login_description()}</Card.Description>
    </Card.Header>
    <Card.Content>
        <div class="flex flex-col gap-4">
            <Button variant="outline" class="w-full" onclick={handleGoogleSignIn}>
                <RiGoogleFill class="h-4 w-4" />
                {m.login_continue_google()}
            </Button>
            <Button variant="outline" class="w-full" onclick={handleGithubSignIn}>
                <RiGithubFill class="h-4 w-4" />
                {m.login_continue_github()}
            </Button>
        </div>
    </Card.Content>
</Card.Root>

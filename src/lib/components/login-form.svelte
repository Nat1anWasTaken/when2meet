<script lang="ts">
    import { authClient } from "$lib/auth-client";
    import { Button } from "$lib/components/ui/button/index.js";
    import * as Card from "$lib/components/ui/card/index.js";
    import { toast } from "svelte-sonner";
    import RiGithubFill from "~icons/ri/github-fill";
    import RiGoogleFill from "~icons/ri/google-fill";

    interface Props {
        redirectTo?: string;
    }

    const { redirectTo }: Props = $props();

    const handleGoogleSignIn = async () => {
        toast.info("Signing in with Google...");

        try {
            await authClient.signIn.social({
                provider: "google",
                callbackURL: redirectTo || "/"
            });
        } catch (error) {
            toast.error("Google sign in failed. Please try again.");
            console.error("Google sign in error:", error);
        }
    };

    const handleGithubSignIn = async () => {
        toast.info("Signing in with GitHub...");

        try {
            await authClient.signIn.social({
                provider: "github",
                callbackURL: redirectTo || "/"
            });
        } catch (error) {
            toast.error("GitHub sign in failed. Please try again.");
            console.error("GitHub sign in error:", error);
        }
    };
</script>

<Card.Root class="mx-auto w-full max-w-sm">
    <Card.Header>
        <Card.Title class="text-2xl">Login</Card.Title>
        <Card.Description>Continue with your social accounts</Card.Description>
    </Card.Header>
    <Card.Content>
        <div class="flex flex-col gap-4">
            <Button variant="outline" class="w-full" onclick={handleGoogleSignIn}>
                <RiGoogleFill class="h-4 w-4" />
                Continue with Google
            </Button>
            <Button variant="outline" class="w-full" onclick={handleGithubSignIn}>
                <RiGithubFill class="h-4 w-4" />
                Continue with GitHub
            </Button>
        </div>
    </Card.Content>
</Card.Root>

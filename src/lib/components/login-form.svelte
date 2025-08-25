<script lang="ts">
    import { goto } from "$app/navigation";
    import { authClient } from "$lib/auth-client";
    import { Button } from "$lib/components/ui/button/index.js";
    import * as Card from "$lib/components/ui/card/index.js";
    import { Input } from "$lib/components/ui/input/index.js";
    import { Label } from "$lib/components/ui/label/index.js";
    import { toast } from "svelte-sonner";
    import RiGoogleFill from "~icons/ri/google-fill";
    import RiGithubFill from "~icons/ri/github-fill";

    interface Props {
        redirectTo?: string;
    }

    const id = $props.id();
    const { redirectTo }: Props = $props();

    let email = $state("");
    let password = $state("");

    const checkEmailValid = () => {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailPattern.test(email);
    };

    const handleLogin = async () => {
        toast.info("Logging in...");

        const result = await authClient.signIn.email({
            email: email,
            password: password
        });

        if (result.error) {
            toast.error(`Login failed: ${result.error.message}`);
            return;
        }

        toast.success("Login successful! Redirecting to home...");

        goto(redirectTo || "/");
    };

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
        <Card.Description>Enter your email below to login to your account</Card.Description>
    </Card.Header>
    <Card.Content onkeydown={(e) => e.key === "Enter" && handleLogin()}>
        <div class="grid gap-4">
            <div class="grid gap-2">
                <Label for="email-{id}">Email</Label>
                <Input
                    id="email-{id}"
                    type="email"
                    placeholder="m@example.com"
                    required
                    bind:value={email}
                />
                {#if !checkEmailValid() && email.length > 0}
                    <p class="text-sm text-destructive">Please enter a valid email address.</p>
                {/if}
            </div>
            <div class="grid gap-2">
                <div class="flex items-center">
                    <Label for="password-{id}">Password</Label>
                    <a href="##" class="ml-auto inline-block text-sm underline">
                        Forgot your password?
                    </a>
                </div>
                <Input id="password-{id}" type="password" required bind:value={password} />
            </div>
            <Button type="submit" class="w-full" onclick={() => handleLogin()}>Login</Button>
            <Button variant="outline" class="w-full" onclick={handleGoogleSignIn}>
                <RiGoogleFill class="h-4 w-4" />
                Login with Google
            </Button>
            <Button variant="outline" class="w-full" onclick={handleGithubSignIn}>
                <RiGithubFill class="h-4 w-4" />
                Login with GitHub
            </Button>
        </div>
        <div class="mt-4 text-center text-sm">
            Don't have an account?
            <a href="/register" class="underline"> Sign up </a>
        </div>
    </Card.Content>
</Card.Root>

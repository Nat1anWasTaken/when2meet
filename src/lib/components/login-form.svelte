<script lang="ts">
    import { goto } from "$app/navigation";
    import { authClient } from "$lib/auth-client";
    import { Button } from "$lib/components/ui/button/index.js";
    import * as Card from "$lib/components/ui/card/index.js";
    import { Input } from "$lib/components/ui/input/index.js";
    import { Label } from "$lib/components/ui/label/index.js";
    import { toast } from "svelte-sonner";
    import RiGoogleFill from "~icons/ri/google-fill";

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
            <Button
                variant="outline"
                class="w-full"
                onclick={() => alert("Login with Google is not yet implemented.")}
            >
                <RiGoogleFill class="h-4 w-4" />
                Login with Google
            </Button>
        </div>
        <div class="mt-4 text-center text-sm">
            Don't have an account?
            <a href="/register" class="underline"> Sign up </a>
        </div>
    </Card.Content>
</Card.Root>

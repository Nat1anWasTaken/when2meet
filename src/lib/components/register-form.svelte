<script lang="ts">
    import { authClient } from "$lib/auth-client";
    import { Button } from "$lib/components/ui/button/index.js";
    import * as Card from "$lib/components/ui/card/index.js";
    import { Input } from "$lib/components/ui/input/index.js";
    import { Label } from "$lib/components/ui/label/index.js";
    import { toast } from "svelte-sonner";

    const id = $props.id();

    let username = $state("");
    let email = $state("");
    let password = $state("");
    let confirmPassword = $state("");

    const checkPasswordsMatch = () => {
        if (password !== confirmPassword) {
            return false;
        }
        return true;
    };

    const checkEmailValid = () => {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailPattern.test(email);
    };

    const handleRegister = async () => {
        toast.info("Registering...");

        const result = await authClient.signUp.email({
            name: username,
            email: email,
            password: password
        });

        if (result.error) {
            toast.error(`Registration failed: ${result.error.message}`);
            return;
        }

        toast.success("Registration successful! Redirecting to home...");
    };
</script>

<Card.Root class="mx-auto w-full max-w-sm">
    <Card.Header>
        <Card.Title class="text-2xl">Register</Card.Title>
        <Card.Description>Create your account to get started</Card.Description>
    </Card.Header>
    <Card.Content>
        <div class="grid gap-4">
            <div class="grid gap-2">
                <Label for="Username-{id}">Username</Label>
                <Input
                    id="Username-{id}"
                    type="text"
                    placeholder="Bill Gates"
                    required
                    bind:value={username}
                />
            </div>
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
                <Label for="password-{id}">Password</Label>
                <Input id="password-{id}" type="password" required bind:value={password} />
            </div>
            <div class="grid gap-2">
                <Label for="confirm-password-{id}">Confirm Password</Label>
                <Input
                    id="confirm-password-{id}"
                    type="password"
                    required
                    bind:value={confirmPassword}
                />
                {#if !checkPasswordsMatch()}
                    <p class="text-sm text-destructive">Passwords do not match.</p>
                {/if}
            </div>
            <Button
                type="submit"
                class="w-full"
                onclick={() => handleRegister()}
                disabled={!checkPasswordsMatch() || !checkEmailValid()}>Register</Button
            >
            <Button
                variant="outline"
                class="w-full"
                onclick={() => alert("Register with Google is not yet implemented.")}
            >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path
                        d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                        fill="currentColor"
                    />
                </svg>
                Register with Google
            </Button>
        </div>
        <div class="mt-4 text-center text-sm">
            Already have an account?
            <a href="/login" class="underline"> Sign in </a>
        </div>
    </Card.Content>
</Card.Root>

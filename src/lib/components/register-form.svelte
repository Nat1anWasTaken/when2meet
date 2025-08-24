<script lang="ts">
    import { goto } from "$app/navigation";
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

        goto("/");
    };
</script>

<Card.Root class="mx-auto w-full max-w-sm">
    <Card.Header>
        <Card.Title class="text-2xl">Register</Card.Title>
        <Card.Description>Create your account to get started</Card.Description>
    </Card.Header>
    <Card.Content onkeydown={(e) => e.key === "Enter" && handleRegister()}>
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
                <RiGoogleFill class="h-4 w-4" />
                Login with Google
            </Button>
        </div>
        <div class="mt-4 text-center text-sm">
            Already have an account?
            <a href="/login" class="underline"> Sign in </a>
        </div>
    </Card.Content>
</Card.Root>

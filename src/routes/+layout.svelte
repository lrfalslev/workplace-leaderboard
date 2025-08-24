<script lang="ts">
	import "../app.css";
	import { Button, Modal, Input, Alert } from "flowbite-svelte";
	import { ExclamationCircleSolid, EyeOutline,  EyeSlashOutline } from "flowbite-svelte-icons";
	import { goto, invalidate } from "$app/navigation";
    import { UserRole } from "$lib/types";
	import { user } from '$lib/stores/user';
	import { alertMessage } from '$lib/stores/alert';
	
	let loginModal = $state(false);
    let showPassword = $state(false);
	let signUpModal = $state(false);
	let error = $state("");

	let username = $state("");
	let password = $state("");
    let confirmPassword = $state("");
	let passwordsMatch = $derived(() => password === confirmPassword);

	async function handleSignUp(event: SubmitEvent) {
    	event.preventDefault();

        if (!passwordsMatch()) {
            return;
        }

		const res = await fetch("/api/users", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ username, password }),
		});

		if (res.ok) {
			await invalidate('app:auth');
        	signUpModal = false;
			error = "";
		} else {
			error = "Sign up failed.";
			console.error(await res.text());
		}
	}

	async function handleLogin(event: SubmitEvent) {
    	event.preventDefault();

		const res = await fetch("/api/users/login", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ username, password }),
		});

		if (res.ok) {
			await invalidate('app:auth');
        	loginModal = false;
			error = "";
		} else {
			error = "Login failed. Please check your credentials.";
			console.error(await res.text());
		}
	}

	async function handleLogout() {
		const res = await fetch("/api/users/logout", {
			method: "POST"
		});

		if (res.ok) {        
			await invalidate('app:auth');
			goto('/');
		} else {
			console.error(await res.text());
		}
	}

    const { children } = $props();
</script>

<div class="min-h-screen w-full flex flex-col bg-gray-700">
	{#if $alertMessage}
		<div class="absolute top-0 right-0 p-2 z-999">
			<Alert border dismissable onclick={() => alertMessage.set(null)}>
			{#snippet icon()}<ExclamationCircleSolid class="h-5 w-5" />{/snippet}
			<span class="font-medium">{$alertMessage}</span>
			</Alert>
		</div>
	{/if}
	{#if $user && $user.role == UserRole.Admin}
		<nav class="w-full text-white flex items-center justify-center sm:justify-end text-xs sm:text-sm">
			<Button href="/" class="py-1 m-0 mt-1" color="alternative">
				<span class="hidden sm:inline">Leaderboard</span>
				<span class="inline sm:hidden">Home</span>
			</Button>
			<Button href="/tickets" class="py-1 m-0 mt-1" color="alternative">Tickets</Button>
			<Button href="/admin" class="py-1 m-0 mt-1" color="alternative">Admin</Button>
			<Button class="py-1 m-0 mt-1 mr-1" color="alternative" onclick={handleLogout}>Logout</Button>
		</nav>
	{:else if $user}
		<nav class="w-full text-white flex justify-end items-center">
			<Button class="text-sm py-1 m-0 mt-1 mx-1" color="alternative" onclick={handleLogout}>Logout</Button>
		</nav>
	{:else}
		<div class="absolute top-0 right-0 p-2">
			<Button class="text-sm py-1 m-0 mt-1 mr-1" color="alternative" onclick={() => loginModal = true}>Login</Button>
			<Button class="text-sm py-1 m-0 mt-1 mr-1" color="alternative" onclick={() => signUpModal = true}>Sign Up</Button>
		</div>
	{/if}
	<main class="flex-grow overflow-hidden flex items-center justify-center">
		{@render children()}
	</main>
</div>
<Modal bind:open={loginModal} size="xs" class="pt-8 text-center">
	{#if error}
		<p class="text-red-500 text-sm">{error}</p>
	{/if}
	<form onsubmit={handleLogin} class="space-y-4">
		<Input bind:value={username} type="text" name="username" placeholder="Username" required/>
		<div class="flex items-center gap-x-1">
			<Input bind:value={password} type={showPassword ? 'text' : 'password'} name="password" placeholder="Password" required/>
			<button type="button" onclick={() => (showPassword = !showPassword)}>
				{#if showPassword}
					<EyeSlashOutline class="dark:text-gray-400 dark:hover:text-white" />
				{:else}
					<EyeOutline class="dark:text-gray-400 dark:hover:text-white" />
				{/if}
			</button>
		</div>
		<div>
			<Button type="submit">Login</Button>
			<Button color="alternative" onclick={() => (loginModal = false, error = "")}>Cancel</Button>
		</div>
	</form>
</Modal>
<Modal bind:open={signUpModal} size="xs" class="pt-8 text-center">
	{#if error}
		<p class="text-red-500 text-sm">{error}</p>
	{/if}
	<form onsubmit={handleSignUp} class="space-y-4">
		<Input bind:value={username} type="text" name="username" placeholder="Username" required/>
		<Input bind:value={password} type="password" name="password" placeholder="Password" required/>
		<Input bind:value={confirmPassword} type="password" name="confirmPassword" placeholder="Confirm Password" required />
		{#if !passwordsMatch() && confirmPassword.length > 0}
			<p style="color: red;">Passwords do not match!</p>
		{/if}
		<div>
			<Button type="submit" disabled={!passwordsMatch()}>Sign Up</Button>
			<Button color="alternative" onclick={() => (signUpModal = false, error = "")}>Cancel</Button>
		</div>
	</form>
</Modal>

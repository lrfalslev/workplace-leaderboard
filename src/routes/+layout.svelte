<script lang="ts">
	import "../app.css";
	import { Button, Modal, Input } from "flowbite-svelte";
	import { goto, invalidate } from "$app/navigation";
	import { page } from '$app/state';
    import { UserRole, type User } from "$lib/types";
	
	const user = $derived(() => page.data.user as User | null);
	let loginModal = $state(false);
	let signUpModal = $state(false);
	let username = "";
	let password = "";

	async function handleSignUp() {
		const res = await fetch("/api/users", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ username, password }),
		});

		if (res.ok) {
			await invalidate('app:auth');
        	loginModal = false;
		} else {
			console.error(await res.text());
		}
	}

	async function handleLogin() {
		const res = await fetch("/api/users/login", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ username, password }),
		});

		if (res.ok) {
			await invalidate('app:auth');
        	loginModal = false;
		} else {
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

	async function checkAuth() {
		const res = await fetch("/api/users/me", {
			method: "GET"
		});

		if (res.ok) {
			const data = await res.json();
			console.log("Authenticated user:", data);
		} else {
			console.warn("Not authenticated:", await res.text());
		}
	}

    const { children } = $props();
</script>

<div class="min-h-screen w-full flex flex-col bg-gray-700">
	{#if user() && user()?.role == UserRole.Admin}
		<nav class="w-full text-white flex justify-end items-center">
			<Button class="text-sm cursor-pointer py-1 m-0 mt-1" color="alternative" onclick={() => goto('/')}>Leaderboard</Button>
			<Button class="text-sm cursor-pointer py-1 m-0 mt-1" color="alternative" onclick={() => goto('/admin')}>Admin</Button>
			<Button class="text-sm cursor-pointer py-1 m-0 mt-1" color="alternative" onclick={() => goto('/admin/users')}>Users</Button>
			<Button class="text-sm cursor-pointer py-1 m-0 mt-1" color="alternative" onclick={() => goto('/lottery')}>Lottery</Button>
			<Button class="text-sm cursor-pointer py-1 m-0 mt-1 mr-1" color="alternative" onclick={handleLogout}>Logout</Button>
		</nav>
	{:else if user()}
		<nav class="w-full text-white flex justify-end items-center">
			<span>Hello, {user()?.username}, you have no role, contact admin to get a role assigned.</span>
			<Button class="text-sm cursor-pointer py-1 m-0 mt-1 mx-1" color="alternative" onclick={handleLogout}>Logout</Button>
		</nav>
	{:else}
		<div class="absolute top-0 right-0 p-2">
			<Button class="text-sm cursor-pointer py-1 m-0 mt-1 mr-1" color="alternative" onclick={() => loginModal = true}>Login</Button>
			<Button class="text-sm cursor-pointer py-1 m-0 mt-1 mr-1" color="alternative" onclick={() => signUpModal = true}>Sign Up</Button>
		</div>
	{/if}
	<!-- <Button class="text-sm cursor-pointer py-1 m-0 mt-1 mr-1" color="alternative" onclick={checkAuth}>
    	Check Auth
	</Button> -->
	<main class="flex-grow overflow-hidden flex items-center justify-center">
		{@render children()}
	</main>
</div>
<Modal bind:open={loginModal} size="xs" class="pt-8 text-center">
	<form onsubmit={handleLogin} class="space-y-4">
		<Input bind:value={username} type="text" name="username" placeholder="Username" required/>
		<Input bind:value={password} type="password" name="password" placeholder="Password" required/>
		<div>
			<Button type="submit">Login</Button>
			<Button color="alternative" onclick={() => (loginModal = false)}>Cancel</Button>
		</div>
	</form>
</Modal>
<Modal bind:open={signUpModal} size="xs" class="pt-8 text-center">
	<form onsubmit={handleSignUp} class="space-y-4">
		<Input bind:value={username} type="text" name="username" placeholder="Username" required/>
		<Input bind:value={password} type="password" name="password" placeholder="Password" required/>
		<div>
			<Button type="submit">Sign Up</Button>
			<Button color="alternative" onclick={() => (signUpModal = false)}>Cancel</Button>
		</div>
	</form>
</Modal>

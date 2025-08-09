<script lang="ts">
	import "../app.css";
	import { Button, Modal, Input } from "flowbite-svelte";
	import { goto } from "$app/navigation";
	import { userStore, type User } from '$lib/auth';

	const user = $derived(() => $userStore);
	let loginModal = $state(false);
	let username = "";
	let password = "";

	async function handleLogin() {
		const res = await fetch("/api/users/login", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ username, password }),
		});

		if (res.ok) {
			const userData = await res.json() as User;
			userStore.set(userData);
		} else {
			console.error(await res.text());
		}
	}

	async function handleLogout() {
		const res = await fetch("/api/users/logout", {
			method: "POST",
			credentials: "include",
		});

		if (res.ok) {
			userStore.set(null);
			goto('/');
		} else {
			console.error(await res.text());
		}
	}

	async function checkAuth() {
		const res = await fetch("/api/users/me", {
			method: "GET",
			credentials: "include",
		});

		if (res.ok) {
			const data = await res.json();
			console.log("Authenticated user:", data);
		} else {
			console.warn("Not authenticated:", await res.text());
		}
	}

	let { children } = $props();
</script>

<div class="min-h-screen w-full flex flex-col bg-gray-700">
	{#if user()}
		<nav class="w-full text-white mb-2 flex justify-end items-center">
			<Button class="text-sm cursor-pointer py-1 m-0 mt-1" color="alternative" onclick={() => goto('/')}>Leaderboard</Button>
			<Button class="text-sm cursor-pointer py-1 m-0 mt-1" color="alternative" onclick={() => goto('/admin')}>Admin</Button>
			<Button class="text-sm cursor-pointer py-1 m-0 mt-1" color="alternative" onclick={() => goto('/lottery')}>Lottery</Button>
			<Button class="text-sm cursor-pointer py-1 m-0 mt-1 mr-1" color="alternative" onclick={handleLogout}>Logout</Button>
		</nav>
	{:else}
		<div class="absolute top-0 right-0 p-2">
			<Button class="text-sm cursor-pointer py-1 m-0 mt-1 mr-1" color="alternative" onclick={() => loginModal = true}>Login</Button>
		</div>
	{/if}
	<Button class="text-sm cursor-pointer py-1 m-0 mt-1 mr-1" color="alternative" onclick={checkAuth}>
    	Check Auth
	</Button>
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

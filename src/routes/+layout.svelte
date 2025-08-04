<script lang="ts">
	import '../app.css';  
	import { Button } from "flowbite-svelte";
	// import { session } from '$stores/session';
	import { goto } from '$app/navigation';

	let user = $state("");

	// const unsubscribe = session.subscribe((value) => {
	// 	user = value;
	// });

	function handleLogin() {
		user = "erika";
		// goto('/login');
	}

	function handleLogout() {
		// session.set(null); // optionally hit a /logout API
		user = "";
		goto('/');
	}
	
	let { children } = $props();
</script>

<div class="min-h-screen w-full flex flex-col bg-gray-700">
		{#if user}
			<nav class="w-full text-white mb-2 flex justify-end items-center">
				<Button class="text-sm cursor-pointer py-1 m-0 mt-1" color="alternative" onclick={() => goto('/')}>Leaderboard</Button>
				<Button class="text-sm cursor-pointer py-1 m-0 mt-1" color="alternative" onclick={() => goto('/admin')}>Admin</Button>
				<Button class="text-sm cursor-pointer py-1 m-0 mt-1" color="alternative" onclick={() => goto('/lottery')}>Lottery</Button>
				<Button class="text-sm cursor-pointer py-1 m-0 mt-1 mr-1" color="alternative" onclick={handleLogout}>Logout</Button>
			</nav> 
		{:else}
			<div class="absolute top-0 right-0 p-2">
				<Button class="text-sm cursor-pointer py-1 m-0 mt-1 mr-1" color="alternative" onclick={handleLogin}>Login</Button>
			</div>
		{/if}
	<main class="flex-grow overflow-hidden flex items-center justify-center">
    	{@render children()}
  	</main>
</div>

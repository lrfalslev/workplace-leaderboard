<script lang="ts">
	import '../app.css';
	
	let { children } = $props();
</script>

<div class="min-h-screen w-full flex items-center justify-center bg-gray-700 overflow-hidden">
	{@render children()}
</div>

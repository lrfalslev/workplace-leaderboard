<script lang="ts">
	import '../app.css';
	
	let { children } = $props();
</script>


<div class="min-h-screen w-full bg-gray-700 flex items-center justify-center">
	{@render children()}
</div>

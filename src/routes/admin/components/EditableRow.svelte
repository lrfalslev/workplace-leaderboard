<script lang="ts">
  import { TableBodyRow, TableBodyCell } from 'flowbite-svelte';
  import { Input, Button } from 'flowbite-svelte';
  import { onMount } from 'svelte';

  export let coordinators: { id: number; name: string }[]; //TODO: reuse Coordinator interface
  export let date: string;
  let topviewInputs: { firstTimeApprovals: number; totalSubmissions: number }[] = [];

  // initialize with empty rows
  onMount(() => {
    topviewInputs = coordinators.map(() => ({ firstTimeApprovals: 0, totalSubmissions: 0 }));
  });

  async function submitTopviews() {
    const payload = coordinators.map((c, index) => ({
      projectCoordinatorId: c.id,
      date,
      firstTimeApprovals: topviewInputs[index].firstTimeApprovals,
      totalSubmissions: topviewInputs[index].totalSubmissions
    }));

    try {
      const res = await fetch('/api/topviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to save');

      // Optional: Show success, reset, invalidate, etc.
      console.log('Saved:', await res.json());
    } catch (err) {
      console.error('Error saving topviews:', err);
    }
  }
</script>

<TableBodyRow>
  <TableBodyCell>{date}</TableBodyCell>
  {#each coordinators as coordinator, i}
    <TableBodyCell class="text-gray-400">
      <Input
        id="firstTimeApprovals"
        placeholder="accepted"
        size="sm"
        class="mb-1"
      />
      <Input
        id="totalSubmissions"
        placeholder="total"
        size="sm"
        class="mt-1"
      />
    </TableBodyCell>
  {/each}
  <TableBodyCell>
    <Button type="submit" class="cursor-pointer">Save</Button>
  </TableBodyCell>
</TableBodyRow>

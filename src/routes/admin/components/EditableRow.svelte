<script lang="ts">
    import { TableBodyRow, TableBodyCell, Input, Button, tooltip } from "flowbite-svelte";
    import {  EditSolid } from "flowbite-svelte-icons";
    import type { Topview, Coordinator } from '../types/topview';

    export let coordinators: Coordinator[];
    export let topviews: Record<string | number, any>;
    export let editing = false;

    async function submitTopviews() {
        const payload = [];
        const { date, ...coordinators } = topviews;

        for (const coordinatorId in coordinators) {
            const metrics = coordinators[coordinatorId];

            payload.push({
                projectCoordinatorId: Number(coordinatorId),
                date,
                firstTimeApprovals: metrics.firstTimeApprovals,
                totalSubmissions: metrics.totalSubmissions
            });
        }

        console.log("update payload:", payload);
        try {
            const response = await fetch('/api/topviews', {
                method: 'POST',
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error("Failed to save");

            editing = false;
        } catch (err) {
            console.error('Error updating topviews.', err);
            alert('❌ Could not save topviews. Please try again.');
        }
    }
</script>

<TableBodyRow>
    <TableBodyCell>{topviews.date}</TableBodyCell>
    
    {#each coordinators as coordinator}
        {#key coordinator.id}
            <TableBodyCell class="text-gray-400">
                {#if editing}
                    <Input 
                        id="firstTimeApprovals" 
                        value={topviews[coordinator.id]?.firstTimeApprovals ?? ''}
                        placeholder="accepted"
                        size="sm"
                        class="mb-1"
                    />
                    <Input
                        id="totalSubmissions"
                        value={topviews[coordinator.id]?.totalSubmissions ?? ''}
                        placeholder="total"
                        size="sm"
                        class="mt-1"
                    />
                {:else}
                    {#if topviews[coordinator.id]}
                        {topviews[coordinator.id].firstTimeApprovals}/{topviews[coordinator.id].totalSubmissions}
                    {:else}
                        —
                    {/if}
                {/if}
            </TableBodyCell>
        {/key}
    {/each}

    <TableBodyCell >
        {#if editing}
            <div class="flex flex-col gap-1 items-center items-stretch">
                <Button type="submit" class="px-2 py-1 text-sm cursor-pointer" onclick={submitTopviews}>Save</Button>
                <Button type="submit" class="px-2 py-1 text-sm cursor-pointer" onclick={() => {editing = false;}}>Cancel</Button>
            </div>
        {:else}
            <button class="cursor-pointer" onclick={() => {editing = true;}}>
                <EditSolid class="dark:text-gray-400 dark:hover:text-white"/>
            </button>
        {/if}
    </TableBodyCell>
</TableBodyRow>

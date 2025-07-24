<script lang="ts">
    import { TableBodyRow, TableBodyCell, Input, Button } from "flowbite-svelte";
    import {  EditSolid } from "flowbite-svelte-icons";
    import type { Topview, Coordinator } from '../types/topview';

    export let coordinators: Coordinator[];
    export let topviews: Topview[] = [];
    export let date: string;
    export let editing = false;
    let topviewInputs = coordinators.map(() => ({
        firstTimeApprovals: 0,
        totalSubmissions: 0
    }));

    async function submitTopviews() {
        const payload = coordinators.map((c, index) => ({
            projectCoordinatorId: c.id,
            date,
            firstTimeApprovals: topviewInputs[index].firstTimeApprovals,
            totalSubmissions: topviewInputs[index].totalSubmissions
        }));

        try {
            const response = await fetch('/api/topviews', {
                method: 'POST',
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                alert('❌ Could not save topviews. Please try again.');
                return;
            }

        } catch (err) {
            console.error('Error updating topviews.', err);
            alert('❌ Could not save topviews. Please try again.');
        }

        try {
            const res = await fetch("/api/topviews", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error("Failed to save");

            // Optional: Show success, reset, invalidate, etc.
            console.log("Saved:", await res.json());
        } catch (err) {
            console.error("Error saving topviews:", err);
        }
    }
</script>

<TableBodyRow>
    <TableBodyCell>{date}</TableBodyCell>
    
    {#each coordinators as coordinator}
        {#key coordinator.id}
            <TableBodyCell class="text-gray-400">
                {#if editing}
                    {#if topviews.find(tv => tv.coordinatorId === coordinator.id)}
                        {#each topviews.filter(tv => tv.coordinatorId === coordinator.id) as topview}
                            <Input id="firstTimeApprovals" value={topview.firstTimeApprovals} size="sm" class="mb-1" />
                            <Input id="totalSubmissions" value={topview.totalSubmissions} size="sm" class="mt-1" />
                        {/each}
                    {:else}
                        <Input id="firstTimeApprovals" placeholder="accepted" size="sm" class="mb-1" />
                        <Input id="totalSubmissions" placeholder="total" size="sm" class="mt-1" />
                    {/if}
                {:else}
                    {#if topviews.find(tv => tv.coordinatorId === coordinator.id)}
                        {#each topviews.filter(tv => tv.coordinatorId === coordinator.id) as topview}
                            {topview.firstTimeApprovals}/{topview.totalSubmissions}
                        {/each}
                    {:else}
                        —
                    {/if}
                {/if}
            </TableBodyCell>
        {/key}
    {/each}

    <TableBodyCell>
        {#if editing}
            <Button type="submit" class="cursor-pointer">Save</Button>
            <Button type="submit" class="cursor-pointer" onclick={() => {editing = false;}}>Cancel</Button>
        {:else}
            <button class="cursor-pointer" onclick={() => {editing = true;}}>
                <EditSolid class="dark:text-gray-400 dark:hover:text-white"/>
            </button>
        {/if}
    </TableBodyCell>
</TableBodyRow>

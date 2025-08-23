<script lang="ts">
    import { TableBodyRow, TableBodyCell, Input, Button } from "flowbite-svelte";
    import {  EditSolid } from "flowbite-svelte-icons";
    import type { Coordinator } from '$lib/types';
    import { showAlert } from "$lib/stores/alert";

    export let coordinators: Coordinator[];
    export let topviews: Record<string | number, any>;    
    export let editing = false;
    let formInputs: Record<number, { firstTimeApprovals: number; totalSubmissions: number }> = {};

    $: if (editing) {
        formInputs = {};
        for (const coordinator of coordinators) {
            const current = topviews[coordinator.id] || { firstTimeApprovals: 0, totalSubmissions: 0 };
            formInputs[coordinator.id] = {
                firstTimeApprovals: current.firstTimeApprovals,
                totalSubmissions: current.totalSubmissions
            };
        }
    }

    async function submitTopviews() {
        const payload = Object.entries(formInputs).map(([id, metrics]) => ({
            projectCoordinatorId: Number(id),
            date: topviews.date,
            firstTimeApprovals: metrics.firstTimeApprovals,
            totalSubmissions: metrics.totalSubmissions
        }));
        
        try {
            const response = await fetch('/api/topviews', {
                method: 'POST',
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
                credentials: 'include'
            });

            if (!response.ok) throw new Error("Failed to save");

            for (const entry of payload) {
                const id = entry.projectCoordinatorId;
                topviews[id] = {
                    firstTimeApprovals: entry.firstTimeApprovals,
                    totalSubmissions: entry.totalSubmissions
                };
            }
            editing = false;
        } catch (err) {
            console.error('Error updating topviews: ', err);
            showAlert('Could not save topviews. Please try again.');
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
                        bind:value={formInputs[coordinator.id].firstTimeApprovals}
                        placeholder="accepted"
                        title="First Sumbission Accepted" 
                        size="sm"
                        class="mb-1"
                    />
                    <Input
                        bind:value={formInputs[coordinator.id].totalSubmissions}
                        placeholder="total"
                        title="Total Topviews Submitted" 
                        size="sm"
                        class="mt-1"
                    />
                {:else}
                    {#if topviews[coordinator.id] && topviews[coordinator.id].totalSubmissions != 0}
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
                <Button type="submit" class="px-2 py-1 text-sm" onclick={submitTopviews}>Save</Button>
                <Button type="submit" class="px-2 py-1 text-sm" onclick={() => {editing = false;}}>Cancel</Button>
            </div>
        {:else}
            <div>
                <button onclick={() => {editing = true;}}>
                    <EditSolid class="dark:text-gray-400 dark:hover:text-white"/>
                </button>
                <slot name="actions"></slot>
            </div>
        {/if}
    </TableBodyCell>
</TableBodyRow>

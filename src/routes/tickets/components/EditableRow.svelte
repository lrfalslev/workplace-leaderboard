<script lang="ts">
    import { TableBodyRow, TableBodyCell, Input, Button } from "flowbite-svelte";
    import {  EditSolid } from "flowbite-svelte-icons";
    import type { TeamMember } from '$lib/types';
    import { showAlert } from "$lib/stores/alert";

    export let teamMembers: TeamMember[];
    export let topviews: Record<string | number, any>;    
    export let editing = false;
    let formInputs: Record<number, { firstTimeApprovals: number; totalSubmissions: number }> = {};

    $: if (editing) {
        formInputs = {};
        for (const teamMember of teamMembers) {
            const current = topviews[teamMember.id] || { firstTimeApprovals: 0, totalSubmissions: 0 };
            formInputs[teamMember.id] = {
                firstTimeApprovals: current.firstTimeApprovals,
                totalSubmissions: current.totalSubmissions
            };
        }
    }

    async function submitTopviews() {
        const payload = Object.entries(formInputs).map(([id, metrics]) => ({
            teamMemberId: Number(id),
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
                const id = entry.teamMemberId;
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
    
    {#each teamMembers as teamMember}
        {#key teamMember.id}
            <TableBodyCell class="text-gray-400">
                {#if editing}
                    <Input
                        bind:value={formInputs[teamMember.id].firstTimeApprovals}
                        placeholder="accepted"
                        title="First Sumbission Accepted" 
                        size="sm"
                        class="mb-1"
                    />
                    <Input
                        bind:value={formInputs[teamMember.id].totalSubmissions}
                        placeholder="total"
                        title="Total Topviews Submitted" 
                        size="sm"
                        class="mt-1"
                    />
                {:else}
                    {#if topviews[teamMember.id] && topviews[teamMember.id].totalSubmissions != 0}
                        {topviews[teamMember.id].firstTimeApprovals}/{topviews[teamMember.id].totalSubmissions}
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

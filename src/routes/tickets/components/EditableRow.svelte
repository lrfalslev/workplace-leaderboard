<script lang="ts">
    import { TableBodyRow, TableBodyCell, Input, Button } from "flowbite-svelte";
    import {  EditSolid } from "flowbite-svelte-icons";
    import type { TeamMember } from '$lib/types';
    import { showAlert } from "$lib/stores/alert";

    export let teamMembers: TeamMember[];
    export let workItems: Record<string | number, any>;    
    export let editing = false;
    let formInputs: Record<number, { ticketsAwarded: number; workItems: number }> = {};

    $: if (editing) {
        formInputs = {};
        for (const teamMember of teamMembers) {
            const current = workItems[teamMember.id] || { ticketsAwarded: 0, workItems: 0 };
            formInputs[teamMember.id] = {
                ticketsAwarded: current.ticketsAwarded,
                workItems: current.workItems
            };
        }
    }

    async function submitWorkItems() {
        const payload = Object.entries(formInputs).map(([id, metrics]) => ({
            date: workItems.date,
            ticketsAwarded: metrics.ticketsAwarded,
            workItems: metrics.workItems,
            teamMemberId: Number(id)
        }));
        
        try {
            const response = await fetch('/api/work-items', {
                method: 'POST',
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!response.ok) 
                throw new Error("Failed to save");

            for (const entry of payload) {
                const id = entry.teamMemberId;
                workItems[id] = {
                    ticketsAwarded: entry.ticketsAwarded,
                    workItems: entry.workItems
                };
            }
            editing = false;
        } catch (err) {
            console.error('Error updating work items: ', err);
            showAlert('Could not save work items. Please try again.');
        }
    }
</script>

<TableBodyRow>
    <TableBodyCell class="text-sm p-4">{workItems.date}</TableBodyCell>
    
    {#each teamMembers as teamMember}
        {#key teamMember.id}
            <TableBodyCell class="text-gray-400 border border-gray-200 dark:border-gray-700">
                {#if editing}
                    <Input
                        bind:value={formInputs[teamMember.id].ticketsAwarded}
                        placeholder="accepted"
                        title="Ticket Awarded Work Items" 
                        size="sm"
                        class="mb-1"
                    />
                    <Input
                        bind:value={formInputs[teamMember.id].workItems}
                        placeholder="total"
                        title="Total Work Items Submitted" 
                        size="sm"
                        class="mt-1"
                    />
                {:else}
                    {#if workItems[teamMember.id] && workItems[teamMember.id].workItems === null}
                        {workItems[teamMember.id].ticketsAwarded}
                    {:else if workItems[teamMember.id] && workItems[teamMember.id].workItems != 0}
                        {workItems[teamMember.id].ticketsAwarded}/{workItems[teamMember.id].workItems}
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
                <Button type="submit" class="px-2 py-1 text-sm" onclick={submitWorkItems}>Save</Button>
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

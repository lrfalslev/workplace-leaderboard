<script lang="ts">
    import { TableBodyRow, TableBodyCell, Input, Button } from "flowbite-svelte";
    import {  EditSolid, TrashBinSolid } from "flowbite-svelte-icons";
    import type { WorkItem } from '$lib/types';

    export type Row = {
        date: string;
        workItems: Record<number, WorkItem>;
    }

    let { teamMemberIds, row, saveRow, deleteRow } = $props<{
        teamMemberIds: number[];
        row: Row;
        saveRow: (payload: WorkItem[]) => Promise<boolean>;
        deleteRow: (date: string, workItemIds: number[]) => void;
    }>();

    let editing = $state(false);
    let formInputs = $state<Record<string, WorkItem>>({});
    
    $effect(() => {
        formInputs = {};
        for (const teamMemberId of teamMemberIds) {
            const existing = row.workItems[teamMemberId];
            formInputs[teamMemberId] = existing
                ? { ...existing }
                : {
                    //do we need to set id to null?
                    date: row.date,
                    teamMemberId: teamMemberId,
                    ticketsAwarded: 0,
                    workItems: 0
                };
        }
    });

    async function handleSave() {
        const success = await saveRow(Object.values(formInputs));
        if (success)
            toggleEditing();
    }

    function handleDelete() {
        const workItemIds = (Object.values(row.workItems) as WorkItem[]).map(item => item.id);
        deleteRow(row.date, workItemIds);
    }
      
    function toggleEditing() {
        editing = !editing;
    }
</script>

<TableBodyRow>
    <TableBodyCell class="text-sm p-4">{row.date}</TableBodyCell>
    
    {#each teamMemberIds as teamMemberId (teamMemberId)}
        {@const workItem = row.workItems[teamMemberId]}
        <TableBodyCell class="text-gray-400 border dark:border-gray-700">
            {#if editing}
                <Input
                    bind:value={formInputs[teamMemberId].ticketsAwarded}
                    placeholder="accepted"
                    title="Ticket Awarded Work Items" 
                    size="sm"
                    class="mb-1"
                />
                <Input
                    bind:value={formInputs[teamMemberId].workItems}
                    placeholder="total"
                    title="Total Work Items Submitted" 
                    size="sm"
                    class="mt-1"
                />
            {:else}
                {#if !workItem}
                    -
                {:else if workItem.workItems === null}
                    {workItem.ticketsAwarded}
                {:else if workItem.workItems === 0}
                    0
                {:else}
                    {workItem.ticketsAwarded}/{workItem.workItems}
                {/if}
            {/if}
        </TableBodyCell>
    {/each}

    <TableBodyCell >
        {#if editing}
            <div class="flex flex-col gap-1 items-center items-stretch">
                <Button type="button" class="px-2 py-1 text-sm" onclick={handleSave}>Save</Button>
                <Button type="button" class="px-2 py-1 text-sm" onclick={toggleEditing}>Cancel</Button>
            </div>
        {:else}
            <div>
                <button type="button" onclick={toggleEditing}>
                    <EditSolid class="dark:text-gray-400 dark:hover:text-white"/>
                </button>
                <button type="button" onclick={handleDelete}>
                    <TrashBinSolid class="dark:text-gray-400 dark:hover:text-white"/>
                </button>
            </div>
        {/if}
    </TableBodyCell>
</TableBodyRow>

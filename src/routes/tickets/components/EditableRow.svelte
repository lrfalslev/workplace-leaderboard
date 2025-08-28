<script lang="ts">
    import { TableBodyRow, TableBodyCell, Input, Button, Tooltip } from "flowbite-svelte";
    import {  EditSolid, ExclamationCircleSolid, TrashBinSolid } from "flowbite-svelte-icons";
    import { TeamType, type Team, type WorkItem } from '$lib/types';
    import { onMount } from "svelte";

    export type Row = {
        date: string;
        workItems: Record<number, WorkItem>;
    }

    type WorkItemFormInput = {
        id: number | null;
        date: string;
        teamMemberId: number;
        ticketsAwarded: string;
        workItems?: string;
    };

    let { team, teamMemberIds, row, saveRow, deleteRow, editing } = $props<{
        team: Team;
        teamMemberIds: number[];
        row: Row;
        saveRow: (payload: WorkItem[]) => Promise<boolean>;
        deleteRow: (date: string, workItemIds: number[]) => void;
        editing: boolean;
    }>();

    let formInputs = $state<Record<string, WorkItemFormInput>>({});
    let errors = $state<Record<number, string>>({});
    
    function validateForm(): boolean {
        let valid = true;
        const newErrors: Record<number, string> = {};

        for (const input of Object.values(formInputs)) {
            const { teamMemberId, ticketsAwarded, workItems } = input;
            const tickets = ticketsAwarded.trim();
            const total = workItems?.trim();

            const hasTickets = tickets !== '';
            const hasTotal = total !== '';
            const ticketsNum = Number(tickets);
            const totalNum = Number(total);

            if (hasTickets && (isNaN(ticketsNum) || ticketsNum < 0)) {
                newErrors[teamMemberId] = 'Tickets must be a non-negative number';
                valid = false;
                continue;
            }

            if (team.type === TeamType.TICKET_AND_TOTAL) {
                if (total !== '' && totalNum !== null) {
                    if (hasTotal && (isNaN(totalNum) || totalNum < 0)) {
                        newErrors[teamMemberId] = 'Total must be a non-negative number';
                        valid = false;
                        continue;
                    }

                    if (hasTickets && hasTotal && ticketsNum > totalNum) {
                        newErrors[teamMemberId] = 'Tickets cannot exceed total';
                        valid = false;
                        continue;
                    }

                    const bothEmpty = !hasTickets && !hasTotal;
                    const bothFilled = hasTickets && hasTotal;

                    if (!bothEmpty && !bothFilled) {
                        newErrors[teamMemberId] = 'Both fields must be filled or both empty';
                        valid = false;
                        continue;
                    }
                }
            }
        }

        errors = newErrors;
        return valid;
    }

    async function handleSave() {
        if (!validateForm()) 
            return;

        const payload: WorkItem[] = Object.values(formInputs)
            .filter(item => item.ticketsAwarded !== '')
            .map(item => ({
                id: item.id,
                date: item.date,
                teamMemberId: item.teamMemberId,
                ticketsAwarded: Number(item.ticketsAwarded),
                workItems: item.workItems === '' ? null : Number(item.workItems)
            }));

        const success = await saveRow(payload);
        if (success)
            toggleEditing();
    }

    function handleDelete() {
        const workItemIds = (Object.values(row.workItems) as WorkItem[]).map(item => item.id);
        deleteRow(row.date, team.name, workItemIds);
    }
      
    function toggleEditing() {
        editing = !editing;
    }

    onMount(() => {
        const initialInputs: Record<string, WorkItemFormInput> = {};
        for (const teamMemberId of teamMemberIds) {
            const existing = row.workItems[teamMemberId];
            initialInputs[teamMemberId] = existing
                ? {
                    ...existing,
                    ticketsAwarded: existing.ticketsAwarded != null ? String(existing.ticketsAwarded) : '',
                    workItems: existing.workItems != null ? String(existing.workItems) : ''
                }
                : {
                    date: row.date,
                    teamMemberId,
                    ticketsAwarded: '',
                    workItems: ''
                };
        }
        formInputs = initialInputs;
    });
</script>

<TableBodyRow class="items-center">
    <TableBodyCell>{row.date}</TableBodyCell>
    
    {#each teamMemberIds as teamMemberId (teamMemberId)}
        {@const workItem = row.workItems[teamMemberId]}
        <TableBodyCell class="border dark:border-gray-700">
            {#if editing}
                {#if formInputs[teamMemberId]}
                    <div class="relative flex justify-center items-center">
                        <div>
                            <Input
                                bind:value={formInputs[teamMemberId].ticketsAwarded}
                                placeholder="tickets"
                                title="Ticket Awarded Work Items" 
                                size="sm"
                                class="mb-1"
                            />
                            {#if team.type == TeamType.TICKET_AND_TOTAL}
                                <Input
                                    bind:value={formInputs[teamMemberId].workItems}
                                    placeholder="total"
                                    title="Total Work Items Submitted" 
                                    size="sm"
                                    class="mt-1"
                                />
                            {/if}
                        </div>
                        {#if errors[teamMemberId]}
                            <ExclamationCircleSolid class="text-red-500 ml-2" />
                            <Tooltip>{errors[teamMemberId]}</Tooltip>
                        {/if}
                    </div>
                {:else}
                    <span class="text-sm text-gray-400">Loading...</span>
                {/if}
            {:else}
                {#if workItem == null || workItem.ticketsAwarded == null || workItem.ticketsAwarded === ""}
                    -
                {:else if workItem.workItems == null}
                    {workItem.ticketsAwarded}
                {:else if workItem.workItems === 0}
                    0
                {:else}
                    {workItem.ticketsAwarded}/{workItem.workItems}
                {/if}
            {/if}
        </TableBodyCell>
    {/each}

    <TableBodyCell class="flex justify-center items-center">
        {#if editing}

            <div class="flex flex-wrap justify-center gap-2 max-w-[200px] w-full">
                <Button type="button" class="px-2 py-1 text-sm flex-1 min-w-[48%]" onclick={handleSave}>Save</Button>
                <Button type="button" class="px-2 py-1 text-sm flex-1 min-w-[48%]" onclick={toggleEditing}>Cancel</Button>
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

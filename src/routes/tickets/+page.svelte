<script lang="ts">
    import { onMount } from "svelte";
    import { Table, TableBody, TableHead, TableHeadCell, Button, Input, Modal, Popover } from "flowbite-svelte";
    import {  TrashBinSolid } from "flowbite-svelte-icons";
    import EditableRow from "./components/EditableRow.svelte";
    import type { WorkItem, TeamMember } from '$lib/types';
    import { showAlert } from "$lib/stores/alert";
    
    let date = $state(new Date().toLocaleDateString('en-CA'));
    
    let deleteTopviewModal = $state(false);
    let selectedTeamMember: TeamMember | null = null;
    let selectedDate: string | null = $state(null);
    let selectedIds: number[] = $state([]);

    let teamMembers: TeamMember[] = $state([]);
    let workItemsArray: Array<Record<string | number, any>> = $state([]);

    async function fetchTeamMembers() {
        try {
            const response = await fetch('/api/team-members');
            const data = await response.json();

            if (response.ok && Array.isArray(data)) {
                teamMembers = data.sort((a, b) => a.name.localeCompare(b.name));
            } else {
                console.error('Unexpected response format: ', data);
            }
        } catch (err) {
            console.error('Failed to fetch topviews: ', err);
        }
    }

    async function fetchWorkItems() {
        try {
            const response = await fetch('/api/work-items');
            const json = await response.json();

            if (response.ok && Array.isArray(json)) {
                const workItemsRaw = json as WorkItem[];
                
                for (const workItem of workItemsRaw) {
                    let dayEntry = workItemsArray.find(entry => entry.date === workItem.date);

                    if (!dayEntry) {
                        dayEntry = { date: workItem.date };
                        workItemsArray.push(dayEntry);
                    }

                    // push ID for later deletion reference
                    dayEntry.ids = dayEntry.ids || [];
                    dayEntry.ids.push(workItem.id);
                    
                    dayEntry[workItem.teamMemberId] = {
                        ticketsAwarded: workItem.ticketsAwarded,
                        workItems: workItem.workItems
                    };
                }

                workItemsArray.sort((a, b) => b.date.localeCompare(a.date));

            } else {
                console.error('Unexpected work items format: ', json);
            }
        } catch (err) {
            console.error('Failed to fetch work items: ', err);
        }
    }

    async function deleteWorkItems(ids: number[]) {
        try {
            const response = await fetch(`/api/work-items`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ticketIds: ids })
            });

            if (!response.ok) {
                throw new Error(await response.text());
            }

            workItemsArray = workItemsArray.filter(entry => {
                return !ids.every(id => entry.ids?.includes(id));
            });
        } catch (err) {
            console.error('Error deleting work items: ', err);
            showAlert('Could not delete work items. Please try again.');
        }
    }

    function addNewRow() {
        let dayEntry = workItemsArray.find(entry => entry.date === date);

        if (!dayEntry) {
            dayEntry = { date: date };
            workItemsArray.unshift(dayEntry);
        }
    }

    onMount(() => {
        fetchTeamMembers();
        fetchWorkItems();
    });
</script>

<div class="max-h-[80vh] overflow-y-auto  w-[80vw] max-w-full table-fixed mx-auto">
    <div class="flex items-center sticky top-0 z-30 mb-2 bg-gray-700">
        <div class="flex gap-2 w-1/2 m-2">
            <Input bind:value={date} type="date" class="flex-1" onkeydown={(e) => e.key === 'Enter' && addNewRow()}/>
            <Button onclick={addNewRow}>Add Date</Button>
        </div>
    </div>
    <Table class="text-center w-full">
        <TableHead>
            <TableHeadCell>Date</TableHeadCell>
            {#each teamMembers as teamMember}
            <TableHeadCell class="group relative">
                <div class="flex justify-center gap-2">
                    {teamMember.name}
                </div>
            </TableHeadCell>
            {/each} 
            <TableHeadCell> 
                <span class="sr-only">Edit</span> 
            </TableHeadCell>
        </TableHead>
        <TableBody>
            {#each workItemsArray as workItems}
                <EditableRow {teamMembers} {workItems}>
                    <button
                        slot="actions"
                        onclick={() => {
                            selectedDate = workItems.date;
                            selectedIds = workItems.ids;
                            deleteTopviewModal = true;
                        }}
                    >
                        <TrashBinSolid class="dark:text-gray-400 dark:hover:text-red-800" />
                    </button>
                </EditableRow>
            {/each}
        </TableBody>
    </Table>
</div>
<Modal form bind:open={deleteTopviewModal} size="xs" class="pt-8 text-center" onaction={async ({ action }) => {
    if (action === 'success' && selectedIds?.length) {
        {deleteWorkItems(selectedIds)}
        deleteTopviewModal = false;
    } else if (action === 'decline') {
        deleteTopviewModal = false;
        selectedTeamMember = null;
    }
    }}>
    <p>
        Delete all work items for date <strong>{selectedDate}</strong>?<br />
        <span class="text-red-400">This action cannot be undone.</span>
    </p>
    <Button class="mr-2" type="submit" value="success">Delete</Button>
    <Button type="submit" value="decline" color="alternative">Cancel</Button>
</Modal>

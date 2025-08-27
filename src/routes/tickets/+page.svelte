<script lang="ts">
    import { onMount } from "svelte";
    import { Table, TableBody, TableHead, TableHeadCell, Button, Input, Modal, Popover, Tabs, TabItem, Card } from "flowbite-svelte";
    import {  TrashBinSolid } from "flowbite-svelte-icons";
    import EditableRow from "./components/EditableRow.svelte";
    import type { WorkItem, TeamMember, Team } from '$lib/types';
    import { showAlert } from "$lib/stores/alert";
    
    let date = $state(new Date().toLocaleDateString('en-CA'));
    
    let deleteTopviewModal = $state(false);
    let selectedDate: string | null = $state(null);
    let selectedIds: number[] = $state([]);
    let selectedTeamId = $state<number | null>(null);

    let teams: Team[] = $state([]);
    let teamMembers: TeamMember[] = $state([]);
    let workItemsArray: Array<Record<string | number, any>> = $state([]);

    async function fetchTeams() {
        try {
            const response = await fetch('/api/teams');
            const data = await response.json();

            if (response.ok && Array.isArray(data)) {
                teams = data;
                if (teams.length) {
                    selectedTeamId = teams[0].id;
                }
            } else {
                console.error('Unexpected response format: ', data);
            }
        } catch (err) {
            console.error('Failed to fetch topviews: ', err);
        }
    }

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
    
    const filteredMembers = $derived(() => 
        teamMembers.filter(tm => tm.teamId === selectedTeamId)
    );

    const filteredWorkItems = $derived(() => 
        workItemsArray.map(entry => {
        const filteredEntry = { ...entry };
            filteredEntry.teamData = filteredMembers().map(member => ({
                member,
                data: entry[member.id]
        }));
        return filteredEntry;
    }));

    function addNewRow() {
        let dayEntry = workItemsArray.find(entry => entry.date === date);

        if (!dayEntry) {
            dayEntry = { date: date };
            workItemsArray.unshift(dayEntry);
        }
    }

    onMount(() => {
        fetchTeams();
        fetchTeamMembers();
        fetchWorkItems();
    });
</script>

<div class="max-w-full">
    <div class="flex gap-2 mb-4">
        {#each teams as team}
            <Button
                color={selectedTeamId === team.id ? 'primary' : 'alternative'}
                onclick={() => selectedTeamId = team.id}
            >
                {team.name}
            </Button>
        {/each}
    </div>
    <div class="max-h-[80vh] overflow-y-auto  w-[80vw] max-w-full table-fixed mx-auto">
        <Card class="max-w-[100%] p-8">
            <div class="flex items-center sticky top-0 z-30 mb-2">
                <div class="flex gap-2 w-1/2 m-2">
                    <Input bind:value={date} type="date" class="flex-1" onkeydown={(e) => e.key === 'Enter' && addNewRow()}/>
                    <Button onclick={addNewRow}>Add Date</Button>
                </div>
            </div>
            <Table class="text-center w-full table-fixed border dark:border-gray-700">
                <TableHead>
                    <TableHeadCell>Date</TableHeadCell>
                    {#each filteredMembers() as teamMember}
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
                    {#each filteredWorkItems() as workItems}
                        <EditableRow teamMembers={filteredMembers()} {workItems}>
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
        </Card>
    </div>
</div>
<Modal form bind:open={deleteTopviewModal} size="xs" class="pt-8 text-center" onaction={async ({ action }) => {
    if (action === 'success' && selectedIds?.length) {
        {deleteWorkItems(selectedIds)}
        deleteTopviewModal = false;
    } else if (action === 'decline') {
        deleteTopviewModal = false;
    }
    }}>
    <p>
        Delete all work items for date <strong>{selectedDate}</strong>?<br />
        <span class="text-red-400">This action cannot be undone.</span>
    </p>
    <Button class="mr-2" type="submit" value="success">Delete</Button>
    <Button type="submit" value="decline" color="alternative">Cancel</Button>
</Modal>

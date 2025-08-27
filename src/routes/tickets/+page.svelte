<script lang="ts">
    import { onMount } from "svelte";
    import { Tabs, TabItem, Modal, Button } from "flowbite-svelte";
    import type { WorkItem, TeamMember, Team } from '$lib/types';
    import { showAlert } from "$lib/stores/alert";
    import type { Row } from "./components/EditableRow.svelte";
    import TeamTable from "./components/TeamTable.svelte";
    
    let teams = $state<Team[]>([]);
    let teamMembers = $state<TeamMember[]>([]);
    let workItems = $state<Row[]>([]);   
    
    let selectedTeamId = $state<number | null>(null);

    let deleteRowModal = $state(false);
    let deleteRowDate = $state<string | null>(null);
    let deleteRowIds = $state<number[]>([]);

    async function fetchTeams() {
        try {
            const response = await fetch('/api/teams');
            if (!response.ok) 
                throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            if (!Array.isArray(data))
                throw new Error('Invalid data format');

            teams = data;
            selectedTeamId = data.length > 0 ? data[0].id : null;
        } catch (err) {
            console.error('Failed to fetch teams: ', err);
            showAlert('Could not load teams.');
        }
    }

    async function fetchTeamMembers() {
        try {
            const response = await fetch('/api/team-members');

            if (!response.ok) 
                throw new Error(`HTTP ${response.status}`);

            const data = await response.json();
            if (!Array.isArray(data))
                throw new Error('Invalid data format');

            teamMembers = data.sort((a, b) => a.name.localeCompare(b.name));
        } catch (err) {
            console.error('Failed to fetch topviews: ', err);
            showAlert('Could not load team members.');
        }
    }

    async function fetchWorkItems() {
        try {
            const response = await fetch('/api/work-items');

            if (!response.ok) 
                throw new Error(`HTTP ${response.status}`);

            const data = await response.json();
            if (!Array.isArray(data))
                throw new Error('Invalid data format');

            const workItemsRaw = data as WorkItem[];
            const tempMap = new Map<string, Row>();

            for (const item of workItemsRaw) {
                const dateKey = item.date;

                if (!tempMap.has(dateKey)) {
                    tempMap.set(dateKey, {
                        date: dateKey,
                        workItems: {}
                    });
                }

                const row = tempMap.get(dateKey)!;
                row.workItems[item.teamMemberId] = {
                    id: item.id,
                    date: item.date,
                    teamMemberId: item.teamMemberId,
                    ticketsAwarded: item.ticketsAwarded,
                    workItems: item.workItems
                };
            }

            workItems = Array.from(tempMap.values()).sort((a, b) => b.date.localeCompare(a.date));

        } catch (err) {
            console.error('Failed to fetch work items: ', err);
            showAlert('Could not load work items.');
        }
    }

    function addRow(date: string) {
        if (!workItems.find(row => row.date === date)) {
            workItems = [...workItems, { date, workItems: {} }];
        }
    }

    function deleteRow(date: string, ids: number[]) {
        deleteRowDate = date;
        deleteRowIds = ids;
        deleteRowModal = true;
    }

    async function deleteWorkItems() {
        try {
            const response = await fetch(`/api/work-items`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ workItemIds: deleteRowIds })
            });

            if (!response.ok)
                throw new Error(await response.text());

            workItems = workItems.map(row => {
                if (row.date !== deleteRowDate) return row;

                const updatedWorkItems = { ...row.workItems };
                for (const id of deleteRowIds) {
                    delete updatedWorkItems[id];
                }

                return { ...row, workItems: updatedWorkItems };
            }).filter(row => Object.keys(row.workItems).length > 0);
        } catch (err) {
            console.error('Error deleting work items: ', err);
            showAlert('Could not delete work items. Please try again.');
        }
    }

    async function saveRow(workItemsToSave: WorkItem[]): Promise<boolean> {        
        try {
            const response = await fetch('/api/work-items', {
                method: 'POST',
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(workItemsToSave)
            });

            if (!response.ok)
                throw new Error(await response.text());

            const result = await response.json();
            if (!Array.isArray(result)) throw new Error('Invalid response format');

            for (const updatedItem of result as WorkItem[]) {
                let row = workItems.find(r => r.date === updatedItem.date);
                if (!row) {
                    row = { date: updatedItem.date, workItems: {} };
                    workItems = [...workItems, row];
                }

                row.workItems[updatedItem.teamMemberId] = {
                    id: updatedItem.id,
                    date: updatedItem.date,
                    ticketsAwarded: updatedItem.ticketsAwarded,
                    workItems: updatedItem.workItems,
                    teamMemberId: updatedItem.teamMemberId
                };
            }

            return true;
        } catch (err) {
            console.error('Error updating work items: ', err);
            showAlert('Could not save work items. Please try again.');
            return false;
        }
    }
    
    // const filteredMembers = $derived(() => 
    //     teamMembers.filter(tm => tm.teamId === selectedTeamId)
    // );

    // const filteredWorkItems = $derived(() => 
    //     workItemsArray.map(entry => {
    //     const filteredEntry = { ...entry };
    //         filteredEntry.teamData = filteredMembers().map(member => ({
    //             member,
    //             data: entry[member.id]
    //     }));
    //     return filteredEntry;
    // }));

    onMount(() => {
        fetchTeams();
        fetchTeamMembers();
        fetchWorkItems();
    });
</script>

<div class="max-w-full">
    <Tabs tabStyle="underline">
        {#each teams as team}
            <TabItem title={team.name} open={selectedTeamId === team.id} onclick={() => selectedTeamId = team.id}>
                <TeamTable 
                    teamType={team.type}
                    teamMembers={teamMembers.filter(tm => tm.teamId === team.id)}
                    rows={workItems}
                    addRow={addRow}
                    saveRow={saveRow}
                    deleteRow={deleteRow}>
                </TeamTable>
            </TabItem>
        {/each}
    </Tabs>
</div>
<Modal form bind:open={deleteRowModal} size="xs" class="pt-8 text-center" onaction={async ({ action }) => {
    if (action === 'success' && deleteRowIds?.length) {
        deleteWorkItems();
        deleteRowModal = false;
    } else if (action === 'decline') {
        deleteRowModal = false;
    }
    }}>
    <p>
        Delete all work items for date <strong>{deleteRowDate}</strong>?<br />
        <span class="text-red-400">This action cannot be undone.</span>
    </p>
    <Button class="mr-2" type="submit" value="success">Delete</Button>
    <Button type="submit" value="decline" color="alternative">Cancel</Button>
</Modal>

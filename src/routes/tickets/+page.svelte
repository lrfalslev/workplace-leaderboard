<script lang="ts">
    import { onMount } from "svelte";
    import { Tabs, TabItem, Modal, Button } from "flowbite-svelte";
    import type { WorkItem, TeamMember, Team } from '$lib/types';
    import { showAlert } from "$lib/stores/alert";
    import type { Row } from "./components/EditableRow.svelte";
    import TeamTable from "./components/TeamTable.svelte";
    import BonusTicketTable from "./components/BonusTicketTable.svelte";
    
    let teams = $state<Team[]>([]);
    let teamMembers = $state<TeamMember[]>([]);
    let workItems = $state<Row[]>([]); 
    
    let selectedTeamId = $state<number | null>(null);

    let deleteRowModal = $state(false);
    let deleteRowDate = $state<string | null>(null);
    let deleteRowTeamName = $state<string | null>(null);
    let deleteRowIds = $state<number[]>([]);

    let newlyAddedDate = $state<string | null>(null);

    const filteredMembers = $derived(() => 
        teamMembers.filter(member => member.teamId === selectedTeamId)
    );

    const filteredWorkItems = $derived(() => {
        const memberIds = filteredMembers().map(member => member.id);
        const seenDates = new Set<string>();

        return workItems
            .map(row => {
                const filtered: Row = {
                    date: row.date,
                    workItems: {}
                };

                for (const id of memberIds) {
                    if (row.workItems[id]) {
                        filtered.workItems[id] = row.workItems[id];
                    }
                }

                return filtered;
            })
            .filter(row => {
                const isRelevant = Object.keys(row.workItems).length > 0 || row.date === newlyAddedDate;
                const isNew = !seenDates.has(row.date);
                if (isRelevant && isNew) {
                    seenDates.add(row.date);
                    return true;
                }
                return false;
            });
    });

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
        const memberIds = filteredMembers().map(member => member.id);

        const dateExistsForTeam = workItems.some(row =>
            row.date === date &&
            memberIds.some(id => row.workItems[id])
        );

        if (dateExistsForTeam) {
            showAlert(`Date ${date} already exists for this team.`);
            return;
        }

        workItems = [...workItems, { date, workItems: {} }]
            .sort((a, b) => b.date.localeCompare(a.date));
        newlyAddedDate = date;
    }

    function deleteRow(date: string, teamName: string, ids: number[]) {
        deleteRowDate = date;
        deleteRowTeamName = teamName;
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

            newlyAddedDate = null;
            return true;
        } catch (err) {
            console.error('Error updating work items: ', err);
            showAlert('Could not save work items. Please try again.');
            return false;
        }
    }

    onMount(() => {
        fetchTeams();
        fetchTeamMembers();
        fetchWorkItems();
    });
</script>

<div class="max-w-full mb-8">
    <Tabs tabStyle="underline">
        {#each teams as team}
            <TabItem title={team.name} open={selectedTeamId === team.id} onclick={() => selectedTeamId = team.id}>
                <TeamTable 
                    team={team}
                    teamMembers={filteredMembers()}
                    rows={filteredWorkItems()}
                    addRow={addRow}
                    saveRow={saveRow}
                    deleteRow={deleteRow}
                    newlyAddedDate={newlyAddedDate}>
                </TeamTable>
            </TabItem>
        {/each}
        <TabItem title="Bonus Tickets">
            <BonusTicketTable teamMembers={teamMembers} />
        </TabItem>
    </Tabs>
</div>
<Modal form bind:open={deleteRowModal} size="xs" class="pt-8 text-center" onaction={async ({ action }) => {
    if (action === 'success' && deleteRowIds?.length) {
        await deleteWorkItems();
        deleteRowModal = false;
    } else if (action === 'decline') {
        deleteRowModal = false;
    }
    }}>
    <p>
        Delete all <strong>{deleteRowTeamName}</strong> work items for date <strong>{deleteRowDate}</strong>?<br />
        <span class="text-red-400">This action cannot be undone.</span>
    </p>
    <Button class="mr-2" type="submit" value="success">Delete</Button>
    <Button type="submit" value="decline" color="alternative">Cancel</Button>
</Modal>

<style>
  :global([role="tabpanel"]) {
    margin-top: 0 !important;
    border-top-left-radius: 0 !important;
  }
</style>
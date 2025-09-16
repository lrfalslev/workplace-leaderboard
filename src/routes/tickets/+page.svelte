<script lang="ts">
    import { onMount } from "svelte";
    import { Tabs, TabItem, Modal, Button } from "flowbite-svelte";
    import { type Log, type TeamMember, type Team, UserRole } from '$lib/types';
    import { showAlert } from "$lib/stores/alert";
    import type { Row } from "./components/EditableRow.svelte";
    import TeamTable from "./components/TeamTable.svelte";
    import BonusTicketTable from "./components/BonusTicketTable.svelte";
    import { user } from "$lib/stores/user";
    
    let teams = $state<Team[]>([]);
    let teamMembers = $state<TeamMember[]>([]);
    let logs = $state<Row[]>([]); 
    
    let selectedTeamId = $state<number | null>(null);

    let deleteRowModal = $state(false);
    let deleteRowDate = $state<string | null>(null);
    let deleteRowTeamName = $state<string | null>(null);
    let deleteRowIds = $state<number[]>([]);

    let newlyAddedDate = $state<string | null>(null);

    let isLoading = $state(true);

    const filteredMembers = $derived(() => 
        teamMembers.filter(member => member.teamId === selectedTeamId)
    );

    const filteredLogs = $derived(() => {
        const memberIds = filteredMembers().map(member => member.id);
        const seenDates = new Set<string>();

        return logs
            .map(row => {
                const filtered: Row = {
                    date: row.date,
                    logs: {}
                };

                for (const id of memberIds) {
                    if (row.logs[id]) {
                        filtered.logs[id] = row.logs[id];
                    }
                }

                return filtered;
            })
            .filter(row => {
                const isRelevant = Object.keys(row.logs).length > 0 || row.date === newlyAddedDate;
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
            const response = await fetch('/api/manager/teams');
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
            const response = await fetch('/api/manager/team-members');

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

    async function fetchLogs() {
        try {
            const response = await fetch('/api/manager/logs');

            if (!response.ok) 
                throw new Error(`HTTP ${response.status}`);

            const data = await response.json();
            if (!Array.isArray(data))
                throw new Error('Invalid data format');

            const logsRaw = data as Log[];
            const tempMap = new Map<string, Row>();

            for (const item of logsRaw) {
                const dateKey = item.date;

                if (!tempMap.has(dateKey)) {
                    tempMap.set(dateKey, {
                        date: dateKey,
                        logs: {}
                    });
                }

                const row = tempMap.get(dateKey)!;
                row.logs[item.teamMemberId] = {
                    id: item.id,
                    date: item.date,
                    teamMemberId: item.teamMemberId,
                    metricId: item.metricId,
                    qualifiedWorkItems: item.qualifiedWorkItems,
                    totalWorkItems: item.totalWorkItems,
                    qualifiedWorkLabel: item.qualifiedWorkLabel,
                    totalWorkLabel: item.totalWorkLabel,
                    isLegacy: item.isLegacy,
                    metricType: item.metricType
                };
            }

            logs = Array.from(tempMap.values()).sort((a, b) => b.date.localeCompare(a.date));

        } catch (err) {
            console.error('Failed to fetch logs: ', err);
            showAlert('Could not load logs.');
        }
    }

    function addRow(date: string) {
        const memberIds = filteredMembers().map(member => member.id);

        const dateExistsForTeam = logs.some(row =>
            row.date === date &&
            memberIds.some(id => row.logs[id])
        );

        if (dateExistsForTeam) {
            showAlert(`Date ${date} already exists for this team.`);
            return;
        }

        logs = [...logs, { date, logs: {} }]
            .sort((a, b) => b.date.localeCompare(a.date));
        newlyAddedDate = date;
    }

    function deleteRow(date: string, teamName: string, ids: number[]) {
        deleteRowDate = date;
        deleteRowTeamName = teamName;
        deleteRowIds = ids;
        deleteRowModal = true;
    }

    async function deleteLogs() {
        try {
            const response = await fetch(`/api/logs`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ logIds: deleteRowIds })
            });

            if (!response.ok)
                throw new Error(await response.text());

            logs = logs.map(row => {
                if (row.date !== deleteRowDate) return row;

                const updatedLogs = { ...row.logs };
                for (const id of deleteRowIds) {
                    delete updatedLogs[id];
                }

                return { ...row, logs: updatedLogs };
            }).filter(row => Object.keys(row.logs).length > 0);
        } catch (err) {
            console.error('Error deleting logs: ', err);
            showAlert('Could not delete logs. Please try again.');
        }
    }

    async function saveRow(logsToSave: Log[]): Promise<boolean> {        
        try {
            const response = await fetch('/api/logs', {
                method: 'POST',
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(logsToSave)
            });

            if (!response.ok)
                throw new Error(await response.text());

            const result = await response.json();
            if (!Array.isArray(result)) throw new Error('Invalid response format');

            for (const updatedItem of result as Log[]) {
                let row = logs.find(r => r.date === updatedItem.date);
                if (!row) {
                    row = { date: updatedItem.date, logs: {} };
                    logs = [...logs, row];
                }


                row.logs[updatedItem.teamMemberId] = {
                    id: updatedItem.id,
                    date: updatedItem.date,
                    teamMemberId: updatedItem.teamMemberId,
                    metricId: updatedItem.metricId,
                    qualifiedWorkItems: updatedItem.qualifiedWorkItems,
                    totalWorkItems: updatedItem.totalWorkItems,
                    qualifiedWorkLabel: updatedItem.qualifiedWorkLabel,
                    totalWorkLabel: updatedItem.totalWorkLabel,
                    isLegacy: updatedItem.isLegacy,
                    metricType: updatedItem.metricType
                };
            }

            newlyAddedDate = null;
            return true;
        } catch (err) {
            console.error('Error updating logs: ', err);
            showAlert('Could not save logs. Please try again.');
            return false;
        }
    }

    onMount(async () => {
        try {
            await Promise.all([
                fetchTeams(),
                fetchTeamMembers(),
                fetchLogs()
            ]);
        } catch (err) {
            console.error('Initial data load failed:', err);
        } finally {
            isLoading = false;
        }
    });
</script>

{#if isLoading}
    <div class="text-center py-8 text-gray-500 dark:text-gray-400">
        Loading data...
    </div>
{:else}
    <div class="max-w-full mb-8">
        <Tabs tabStyle="underline">
            {#each teams as team}
                <TabItem title={team.name} open={selectedTeamId === team.id} onclick={() => selectedTeamId = team.id}>
                    <TeamTable 
                        team={team}
                        teamMembers={filteredMembers()}
                        rows={filteredLogs()}
                        addRow={addRow}
                        saveRow={saveRow}
                        deleteRow={deleteRow}
                        newlyAddedDate={newlyAddedDate}>
                    </TeamTable>
                </TabItem>
            {/each}
            {#if $user && $user.role == UserRole.ADMIN}
                <TabItem title="Bonus Tickets">
                    <BonusTicketTable teamMembers={teamMembers} />
                </TabItem>
            {/if}
        </Tabs>
    </div>
{/if}

<Modal form bind:open={deleteRowModal} size="xs" class="pt-8 text-center" onaction={async ({ action }) => {
    if (action === 'success' && deleteRowIds?.length) {
        await deleteLogs();
        deleteRowModal = false;
    } else if (action === 'decline') {
        deleteRowModal = false;
    }
    }}>
    <p>
        Delete all <strong>{deleteRowTeamName}</strong> logs for date <strong>{deleteRowDate}</strong>?<br />
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
<script lang="ts">
    import { onMount } from "svelte";
    import { Tabs, TabItem, Modal, Button } from "flowbite-svelte";
    import { type Log, type TeamMember, type Team, UserRole, type Metric } from '$lib/types';
    import { showAlert } from "$lib/stores/alert";
    import type { Row } from "./components/EditableRow.svelte";
    import TeamTable from "./components/TeamTable.svelte";
    import BonusTicketTable from "./components/BonusTicketTable.svelte";
    import { user } from "$lib/stores/user";

    const BONUS_TAB_ID = -1;
    
    let teams = $state<Team[]>([]);
    let metrics = $state<Metric[]>([]);
    let teamMembers = $state<TeamMember[]>([]);
    let rows = $state<Row[]>([]);
     
    let isLoading = $state(true);
    let activeTabId = $state<number>();
    let activeTeamId = $state<number | null>(null);
    let newlyAddedDate = $state<string | null>(null);
    
    //delete state
    let deleteRowModal = $state(false);
    let deleteRowDate = $state<string | null>(null);
    let deleteRowTeamName = $state<string | null>(null);
    let deleteRowLogIds = $state<number[]>([]);
    
    const filteredMetrics = $derived(() => 
        metrics.filter(metric => metric.teamId === activeTeamId)
    );

    const filteredMembers = $derived(() => 
        teamMembers.filter(member => member.teamId === activeTeamId)
    );

    const filteredRows = $derived(() => {
        const memberIds = filteredMembers().map(member => member.id);
        const seenDates = new Set<string>();

        return rows
            .map(row => ({
                date: row.date,
                logs: Object.fromEntries(
                    memberIds
                        .filter(id => row.logs[id])
                        .map(id => [id, row.logs[id]])
                )
            }))
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
            teams = await fetchJsonArray<Team>('/api/manager/teams');
        } catch (err) {
            console.error('Failed to fetch teams: ', err);
            showAlert('Could not load teams.');
        }
    }

    async function fetchMetrics() {
        try {
            metrics = await fetchJsonArray<Metric>('/api/manager/metrics');
        } catch (err) {
            console.error('Failed to fetch metrics: ', err);
            showAlert('Could not load metrics.');
        }
    }

    async function fetchTeamMembers() {
        try {
            teamMembers = (await fetchJsonArray<TeamMember>('/api/manager/team-members'))
                .sort((a, b) => a.name.localeCompare(b.name));
        } catch (err) {
            console.error('Failed to fetch team members: ', err);
            showAlert('Could not load team members.');
        }
    }

    async function fetchLogs() {
        try {
            const logsRaw = await fetchJsonArray<Log>('/api/manager/logs');
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
                
                if (!row.logs[item.teamMemberId]) {
                    row.logs[item.teamMemberId] = {};
                }
                
                row.logs[item.teamMemberId][item.metricId] = {
                    id: item.id,
                    date: item.date,
                    teamMemberId: item.teamMemberId,
                    metricId: item.metricId,
                    qualifiedWorkItems: item.qualifiedWorkItems,
                    totalWorkItems: item.totalWorkItems,
                };
            }

            rows = Array.from(tempMap.values()).sort((a, b) => b.date.localeCompare(a.date));
        } catch (err) {
            console.error('Failed to fetch logs: ', err);
            showAlert('Could not load logs.');
        }
    }

    async function fetchJsonArray<T>(url: string): Promise<T[]> {
        const response = await fetch(url);
        if (!response.ok) 
            throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        if (!Array.isArray(data)) 
            throw new Error('Invalid data format');

        return data;
    }

    function addRow(date: string) {
        const memberIds = filteredMembers().map(member => member.id);

        const dateExistsForTeam = rows.some(row =>
            row.date === date &&
            memberIds.some(id => row.logs[id] && Object.keys(row.logs[id]).length > 0)
        );

        if (dateExistsForTeam) {
            showAlert(`Date ${date} already exists for this team.`);
            return;
        }

        const nonLegacyMetrics = filteredMetrics().filter(m => !m.isLegacy);

        const newLogs: Row['logs'] = {};
        for (const memberId of memberIds) {
            newLogs[memberId] = {};
            for (const metric of nonLegacyMetrics) {
                newLogs[memberId][metric.id] = {
                    date,
                    teamMemberId: memberId,
                    metricId: metric.id,
                    qualifiedWorkItems: null,
                    totalWorkItems: null
                };
            }
        }
        rows = [...rows, { date, logs: newLogs }]
            .sort((a, b) => b.date.localeCompare(a.date));
        newlyAddedDate = date;
    }

    function deleteRow(date: string, teamName: string, logIds: number[]) {
        deleteRowDate = date;
        deleteRowTeamName = teamName;
        deleteRowLogIds = logIds;
        deleteRowModal = true;
    }

    async function deleteLogs() {
        try {
            const response = await fetch(`/api/logs`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ logIds: deleteRowLogIds })
            });

            if (!response.ok)
                throw new Error(await response.text());

            rows = rows.map(row => {
                if (row.date !== deleteRowDate) 
                    return row;

                    const updatedLogs: Row['logs'] = {};
                    for (const memberId in row.logs) {
                        const log = { ...row.logs[memberId] };
                        for (const metricId in log) {
                            if (deleteRowLogIds.includes(log[metricId].id!))
                                delete log[metricId];
                        }
                        if (Object.keys(log).length > 0) {
                            updatedLogs[+memberId] = log;
                        }
                    }
                    return { ...row, logs: updatedLogs };
                })
                .filter(row => Object.keys(row.logs).length > 0);
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
            if (!Array.isArray(result))
                throw new Error('Invalid response format');

            for (const updatedLog of result as Log[]) {
                let row = rows.find(log => log.date === updatedLog.date);

                if (!row) {
                    row = { date: updatedLog.date, logs: {} };
                    rows = [...rows, row];
                }

                if (!row.logs[updatedLog.teamMemberId]) {
                    row.logs[updatedLog.teamMemberId] = {};
                }

                row.logs[updatedLog.teamMemberId][updatedLog.metricId] = updatedLog;
            }

            newlyAddedDate = null;
            return true;
        } catch (err) {
            console.error('Error updating logs: ', err);
            showAlert('Could not save logs. Please try again.');
            return false;
        }
    }

    function selectTab(id: number) {
        activeTeamId = id === BONUS_TAB_ID ? null : id;
        activeTabId = id;
        localStorage.setItem('activeTabId', String(id));
    }
    
    function initActiveTab() {
        const storedId = localStorage.getItem('activeTabId');
        const storedIdNum = storedId ? Number(storedId) : null;

        if (storedIdNum === BONUS_TAB_ID && $user?.role === UserRole.ADMIN) {
            selectTab(BONUS_TAB_ID);
        } else if (storedIdNum && teams.some(t => t.id === storedIdNum)) {
            selectTab(storedIdNum);
        } else if (teams.length > 0) {
            selectTab(teams[0].id);
        }
    }

    onMount(async () => {
        try {
            await Promise.all([
                fetchTeams(),
                fetchTeamMembers(),
                fetchLogs(),
                fetchMetrics()
            ]);
            initActiveTab();
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
                <TabItem title={team.name} open={activeTabId === team.id} onclick={() => selectTab(team.id)}>
                    <TeamTable 
                        teamName={team.name}
                        metrics={filteredMetrics()}
                        teamMembers={filteredMembers()}
                        rows={filteredRows()}
                        addRow={addRow}
                        saveRow={saveRow}
                        deleteRow={deleteRow}
                        newlyAddedDate={newlyAddedDate}>
                    </TeamTable>
                </TabItem>
            {/each}
            {#if $user && $user.role === UserRole.ADMIN}
                <TabItem title="Bonus Tickets" open={activeTabId === BONUS_TAB_ID} onclick={() => selectTab(BONUS_TAB_ID)}>
                    <BonusTicketTable teamMembers={teamMembers} />
                </TabItem>
            {/if}
        </Tabs>
    </div>
{/if}

<Modal form bind:open={deleteRowModal} size="xs" class="pt-8 text-center" onaction={async ({ action }) => {
        if (action === 'success' && deleteRowLogIds.length) {
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
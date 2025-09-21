<script lang="ts">
    import { Input, Button, Card, Table, TableHead, TableHeadCell, TableBody } from "flowbite-svelte";
    import type { Team, TeamMember, Log, Metric } from '$lib/types';
    import EditableRow, { type Row } from "./EditableRow.svelte";
    import { CirclePlusSolid } from "flowbite-svelte-icons";

    let { teamName, metrics, teamMembers, rows, addRow, saveRow, deleteRow, newlyAddedDate }: {
        teamName: string;
        metrics: Metric[];   
        teamMembers: TeamMember[];    
        rows: Row[];
        addRow: (date: string) => void;
        saveRow: (payload: Log[]) => Promise<boolean>;
        deleteRow: (date: string, teamName: string, logIds: number[]) => void;
        newlyAddedDate: string | null;
    } = $props();
    
    const teamMemberIds = teamMembers.map(m => m.id);
    let newDate = $state(new Date().toLocaleDateString('en-CA'));
    const dateExists = $derived(() => rows.some(row => row.date === newDate));
</script>

<div class="flex items-left sticky top-0 z-30 justify-end">
    <div class="flex gap-2 mb-4 mr-12">
        <Input bind:value={newDate} type="date" class="flex-1" onkeydown={(e) => e.key === 'Enter' && addRow(newDate)}/>
        <Button
            aria-label="Add new row"
            onclick={() => addRow(newDate)}
            disabled={dateExists()}
            title={dateExists() ? 'This date already exists' : ''}>
            <CirclePlusSolid class="dark:text-white"/>
        </Button>
    </div>
</div>

<div class="max-h-[75vh] overflow-y-auto max-w-[80vw] table-fixed mx-auto border-2 dark:border-gray-700">
    <Card class="max-w-full">
        <Table class="text-center table-fixed p-0">
            <TableHead>
                <TableHeadCell>Date</TableHeadCell>
                {#each teamMembers as { name } (name)}
                    <TableHeadCell class="group relative">
                        <div class="flex justify-center gap-2">
                            {name}
                        </div>
                    </TableHeadCell>
                {/each} 
                <TableHeadCell> 
                    <span class="sr-only">Edit</span> 
                </TableHeadCell>
            </TableHead>
            <TableBody>
                {#each rows as row (row.date)}
                    <EditableRow 
                        teamName={teamName}
                        metrics={metrics}
                        teamMemberIds={teamMemberIds}
                        row={row}
                        saveRow={saveRow}
                        deleteRow={deleteRow}
                        isNew={row.date === newlyAddedDate}
                    />
                {/each}
            </TableBody>
        </Table>
    </Card>
</div>
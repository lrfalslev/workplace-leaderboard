<script lang="ts">
    import { Input, Button, Card, Table, TableHead, TableHeadCell, TableBody } from "flowbite-svelte";
    import type { Team, TeamMember, TeamType, WorkItem } from '$lib/types';
    import EditableRow, { type Row } from "./EditableRow.svelte";

    let { teamType, teamMembers, rows, addRow, saveRow, deleteRow } = $props<{
        teamType: TeamType;
        teamMembers: TeamMember[];    
        rows: Row[];
        addRow: (date: string) => void;
        saveRow: (payload: WorkItem[]) => Promise<boolean>;
        deleteRow: (date: string, workItemIds: number[]) => void;
    }>();

    let newDate = $state(new Date().toLocaleDateString('en-CA'));
    const doesDateExist = $derived(() => rows.some((row: Row) => row.date === newDate));
</script>

<div class="max-h-[80vh] overflow-y-auto  w-[80vw] max-w-full table-fixed mx-auto">
    <Card class="max-w-[100%] p-8">
        <div class="flex items-center sticky top-0 z-30 mb-2">
            <div class="flex gap-2 w-1/2 m-2">
                <Input bind:value={newDate} type="date" class="flex-1" onkeydown={(e) => e.key === 'Enter' && addRow(newDate)}/>
                <Button
                    onclick={() => addRow(newDate)}
                    disabled={doesDateExist()} title={doesDateExist() ? 'This date already exists' : ''}>Add Date</Button>
            </div>
        </div>
        <Table class="text-center w-full table-fixed border dark:border-gray-700">
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
                {#each rows as row (row.date)}
                    <EditableRow 
                        teamMemberIds={teamMembers.map((members: TeamMember) => members.id)}
                        row={row}
                        saveRow={saveRow}
                        deleteRow={deleteRow}>
                    </EditableRow>
                {/each}
            </TableBody>
        </Table>
    </Card>
</div>
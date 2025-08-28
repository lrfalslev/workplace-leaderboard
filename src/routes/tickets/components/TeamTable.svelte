<script lang="ts">
    import { Input, Button, Card, Table, TableHead, TableHeadCell, TableBody } from "flowbite-svelte";
    import type { Team, TeamMember, TeamType, WorkItem } from '$lib/types';
    import EditableRow, { type Row } from "./EditableRow.svelte";
    import { CirclePlusSolid } from "flowbite-svelte-icons";

    let { team, teamMembers, rows, addRow, saveRow, deleteRow, newlyAddedDate } = $props<{
        team: Team;
        teamMembers: TeamMember[];    
        rows: Row[];
        addRow: (date: string) => void;
        saveRow: (payload: WorkItem[]) => Promise<boolean>;
        deleteRow: (date: string, workItemIds: number[]) => void;
        newlyAddedDate: string | null;
    }>();

    let newDate = $state(new Date().toLocaleDateString('en-CA'));
    const doesDateExist = $derived(() => rows.some((row: Row) => row.date === newDate));
</script>

<div class="max-h-[80vh] overflow-y-auto  w-[80vw] max-w-full table-fixed mx-auto">
    <Card class="max-w-[100%] p-4 border-none">
        <div class="flex items-left sticky top-0 z-30 mb-2 justify-end">
            <div class="flex gap-2 m-2">
                <Input bind:value={newDate} type="date" class="flex-1" onkeydown={(e) => e.key === 'Enter' && addRow(newDate)}/>
                <Button
                    onclick={() => addRow(newDate)}
                    disabled={doesDateExist()} title={doesDateExist() ? 'This date already exists' : ''}>
                    <CirclePlusSolid class="dark:text-white"/>
                </Button>
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
                {#each rows as row (team.id + '-' + row.date)}
                    <EditableRow 
                        teamMemberIds={teamMembers.map((members: TeamMember) => members.id)}
                        row={row}
                        saveRow={saveRow}
                        deleteRow={deleteRow}
                        editing={row.date === newlyAddedDate}>
                    </EditableRow>
                {/each}
            </TableBody>
        </Table>
    </Card>
</div>
<script lang="ts">
    import { Input, Button, Card, Table, TableHead, TableHeadCell, TableBody } from "flowbite-svelte";
    import type { Team, TeamMember, Log } from '$lib/types';
    import EditableRow, { type Row } from "./EditableRow.svelte";
    import { CirclePlusSolid } from "flowbite-svelte-icons";

    let { team, teamMembers, rows, addRow, saveRow, deleteRow, newlyAddedDate } = $props<{
        team: Team;
        teamMembers: TeamMember[];    
        rows: Row[];
        addRow: (date: string) => void;
        saveRow: (payload: Log[]) => Promise<boolean>;
        deleteRow: (date: string, teamName: string, logIds: number[]) => void;
        newlyAddedDate: string | null;
    }>();

    let newDate = $state(new Date().toLocaleDateString('en-CA'));
    const doesDateExist = $derived(() => rows.some((row: Row) => row.date === newDate));
</script>

<div class="flex items-left sticky top-0 z-30 justify-end">
    <div class="flex gap-2 mb-4 mr-12">
        <Input bind:value={newDate} type="date" class="flex-1" onkeydown={(e) => e.key === 'Enter' && addRow(newDate)}/>
        <Button
            onclick={() => addRow(newDate)}
            disabled={doesDateExist()}
            title={doesDateExist() ? 'This date already exists' : ''}>
            <CirclePlusSolid class="dark:text-white"/>
        </Button>
    </div>
</div>
<div class="max-h-[75vh] overflow-y-auto max-w-[80vw] table-fixed mx-auto border-2 dark:border-gray-700">
    <Card class="max-w-full">
        <Table class="text-center table-fixed p-0">
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
                        team={team}
                        teamMemberIds={teamMembers.map((members: TeamMember) => members.id)}
                        row={row}
                        saveRow={saveRow}
                        deleteRow={deleteRow}
                        isNew={row.date === newlyAddedDate}>
                    </EditableRow>
                {/each}
            </TableBody>
        </Table>
    </Card>
</div>
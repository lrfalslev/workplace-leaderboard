<script lang="ts">
    import { Input, Button, Card, Datepicker, Checkbox } from "flowbite-svelte";
    import { type TeamMember, type Log, type Metric, MetricType, UserRole } from '$lib/types';
    import EditableRow, { type Row } from "./EditableRow.svelte";
    import { CirclePlusSolid } from "flowbite-svelte-icons";
    import { user } from "$lib/stores/user";

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
        
    let dateRange = $state(getCurrentMonthBounds());
    let allTime = $state(!$user || $user.role !== UserRole.ADMIN);

    function getCurrentMonthBounds(): { from: Date; to: Date } {
        const now = new Date();
        const from = new Date(now.getFullYear(), now.getMonth(), 1);
        const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return { from, to };
    }

    const filteredRows = $derived(() => {
        if (allTime) 
            return rows;

        const fromStr = dateRange.from?.toISOString().slice(0,10);
        const toStr = dateRange.to?.toISOString().slice(0,10);
        
        return rows.filter(row => {
            return (!fromStr || row.date >= fromStr) && (!toStr || row.date <= toStr);
        });
    });

    const totals = $derived(() => {
        const result: Record<string, { qualified: number; total: number }> = {};

        for (const row of filteredRows()) {
            for (const memberId of teamMemberIds) {
                for (const metric of metrics) {
                    const log = row.logs[memberId]?.[metric.id];
                    if (!log) 
                        continue;

                    const key = `${memberId}-${metric.id}`;
                    if (!result[key]) 
                        result[key] = { qualified: 0, total: 0 };

                    result[key].qualified += log.qualifiedWorkItems ?? 0;
                    result[key].total += log.totalWorkItems ?? 0;
                }
            }
        }
        return result;
    });
</script>

<div class="h-[75vh] w-[80vw] table-fixed mx-auto flex flex-col">
    <div class="flex justify-between items-start mb-4 mx-4"> 
        {#if $user && $user.role == UserRole.ADMIN}
            <div class="flex gap-4">
                <Datepicker range bind:rangeFrom={dateRange.from} bind:rangeTo={dateRange.to} disabled={allTime}/>
                <Checkbox bind:checked={allTime} type="checkbox" class="text-sm me-0">All Time</Checkbox>
            </div>
        {/if}
        <div class="flex gap-2 ml-auto">
            <Input bind:value={newDate} type="date" onkeydown={(e) => e.key === 'Enter' && addRow(newDate)}/>
            <Button
                aria-label="Add new row"
                onclick={() => addRow(newDate)}
                disabled={dateExists()}
                title={dateExists() ? 'This date already exists' : ''}>
                <CirclePlusSolid class="dark:text-white"/>
            </Button>
        </div>
    </div>
    <div class="overflow-y-auto rounded-xl">
        <Card class="max-w-full border-3 dark:border-gray-700 rounded-xl">
            <table class="w-full">
                <thead>
                    <tr>
                        <th>Date</th>
                        {#each teamMembers as { name } (name)}
                            <th class="group relative">
                                <div class="flex justify-center gap-2">
                                    {name}
                                </div>
                            </th>
                        {/each} 
                        <th> 
                            <span class="sr-only">Edit</span> 
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {#each filteredRows() as row (row.date)}
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
                </tbody>
                {#if $user && $user.role == UserRole.ADMIN}
                    <tfoot>
                        <tr>
                            <td>
                                {#each metrics as metric}
                                    {#if metric.type === MetricType.TICKET_ONLY}
                                        {metric.qualifiedWorkLabel}<br />
                                    {:else}
                                        <div class="truncate max-w-[8rem]" title={`${metric.qualifiedWorkLabel} / ${metric.totalWorkLabel}`}>
                                            {metric.qualifiedWorkLabel}/{metric.totalWorkLabel}
                                        </div>
                                    {/if}
                                {/each}
                            </td>
                            {#each teamMemberIds as memberId}
                                <td>
                                    {#each metrics as metric}
                                        {#if totals()[`${memberId}-${metric.id}`]}
                                            {#if metric.type === MetricType.TICKET_ONLY}
                                                {totals()[`${memberId}-${metric.id}`].qualified}
                                            {:else}
                                                {totals()[`${memberId}-${metric.id}`].qualified}/{totals()[`${memberId}-${metric.id}`].total}
                                            {/if}
                                        {:else}
                                            0
                                        {/if}
                                        <br />
                                    {/each}
                                </td>
                            {/each}
                            <td></td>
                        </tr>
                    </tfoot>
                {/if}
            </table>
        </Card>
    </div>
</div>
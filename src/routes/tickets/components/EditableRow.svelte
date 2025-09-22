<script lang="ts">
    import { TableBodyRow, TableBodyCell, Input, Button, Tooltip } from "flowbite-svelte";
    import { EditSolid, ExclamationCircleSolid, TrashBinSolid } from "flowbite-svelte-icons";
    import { MetricType, type Log, type Metric } from '$lib/types';
    import { onMount } from "svelte";

    export type Row = {
        date: string;
        logs: Record<number, Record<number, Log>>;
    }

    type LogFormInput = {
        id?: number;
        date: string;
        teamMemberId: number;
        metricId: number;
        qualifiedWorkItems: string;
        totalWorkItems?: string;
    };

    let { teamName, metrics, teamMemberIds, row, saveRow, deleteRow, isNew }: {
        teamName: string;
        metrics: Metric[];
        teamMemberIds: number[];
        row: Row;
        saveRow: (payload: Log[]) => Promise<boolean>;
        deleteRow: (date: string, teamName: string, logIds: number[]) => void;
        isNew: boolean
    } = $props();

    let isLoading = $state(true);
    let isEditing = $state(isNew);
    let logFormInputs = $state<Record<number, Record<number, LogFormInput>>>({});
    let formValidationErrors = $state<Record<string, string>>({}); // key: memberId-metricId

    const hasLegacyMetric = Object.values(row.logs).some(memberLogs =>
        Object.keys(memberLogs).some(metricId => 
            metrics.find(m => m.id === Number(metricId))?.isLegacy
        )
    );

    const displayMetrics = hasLegacyMetric
        ? metrics.filter(m => m.isLegacy)
        : metrics.filter(m => !m.isLegacy);

    function validateForm(): boolean {
        let valid = true;
        const newErrors: Record<string, string> = {};

        for (const memberId in logFormInputs) {
            for (const metricId in logFormInputs[memberId]) {
                const key = `${memberId}-${metricId}`;
                const input = logFormInputs[memberId][metricId];
                
                const tickets = input.qualifiedWorkItems.trim();
                const total = input.totalWorkItems?.trim();
                const hasTickets = tickets !== '';
                const hasTotal = total !== '';
                const ticketsNum = Number(tickets);
                const totalNum = Number(total);

                if (hasTickets && (isNaN(ticketsNum) || ticketsNum < 0)) {
                    newErrors[key] = 'Tickets must be a non-negative number';
                    valid = false;
                    continue;
                }

                if (metrics.find(metric => metric.id === input.metricId)?.type === MetricType.TICKET_AND_TOTAL) {
                    const bothEmpty = !hasTickets && !hasTotal;
                    const bothFilled = hasTickets && hasTotal;

                    if (!bothEmpty && !bothFilled) {
                        newErrors[key] = 'Both fields must be filled or both empty';
                        valid = false;
                        continue;
                    }

                    if (hasTotal && (isNaN(totalNum) || totalNum < 0)) {
                        newErrors[key] = 'Total must be a non-negative number';
                        valid = false;
                        continue;
                    }

                    if (hasTickets && hasTotal && ticketsNum > totalNum) {
                        newErrors[key] = 'Tickets cannot exceed total';
                        valid = false;
                        continue;
                    }
                }
            }
        }

        formValidationErrors = newErrors;
        return valid;
    }

    async function handleSave() {
        if (!validateForm()) 
            return;

        const payload: Log[] = [];
        for (const memberId in logFormInputs) {
            for (const metricId in logFormInputs[memberId]) {
                const log = logFormInputs[memberId][metricId];
                if (log.qualifiedWorkItems !== '') {
                    payload.push({
                        date: log.date,
                        teamMemberId: log.teamMemberId,
                        metricId: log.metricId,
                        qualifiedWorkItems: Number(log.qualifiedWorkItems),
                        totalWorkItems: log.totalWorkItems === '' ? null : Number(log.totalWorkItems),
                    });
                }
            }
        }

        const success = await saveRow(payload);
        if (success) toggleEditing();
    }

    function handleDelete() {
        const logIds = Object.values(row.logs)
            .flatMap(memberLogs => Object.values(memberLogs))
            .map(log => log.id)
            .filter((id): id is number => id != null);

        deleteRow(row.date, teamName, logIds);
    }

    function toggleEditing() {
        isEditing = !isEditing;
    }
    
    onMount(() => {
        const initialInputs: Record<number, Record<number, LogFormInput>> = {};

        for (const memberId of teamMemberIds) {
            initialInputs[memberId] = {};
            for (const metric of metrics) {
                const existing = row.logs[memberId]?.[metric.id];
                initialInputs[memberId][metric.id] = {
                    date: row.date,
                    teamMemberId: memberId,
                    metricId: metric.id,
                    qualifiedWorkItems: existing?.qualifiedWorkItems != null ? String(existing.qualifiedWorkItems) : '',
                    totalWorkItems: existing?.totalWorkItems != null ? String(existing.totalWorkItems) : ''
                };
            }
        }

        logFormInputs = initialInputs;
        isLoading = false;
    });
</script>

{#if isLoading}
    <TableBodyRow>
        <TableBodyCell colspan={teamMemberIds.length + 2}>
            Loading...
        </TableBodyCell>
    </TableBodyRow>
{:else}
    <TableBodyRow class="items-center">
        <TableBodyCell class="px-2 text-center">{row.date}</TableBodyCell>

        {#each teamMemberIds as memberId (memberId)}
            <TableBodyCell class="align-middle border dark:border-gray-700 p-2">
                {#if isEditing}
                    {#each displayMetrics as metric (metric.id)}
                        <div class="relative flex flex-col items-center my-1">
                            <Input
                                bind:value={logFormInputs[memberId][metric.id].qualifiedWorkItems}
                                placeholder={metric.qualifiedWorkLabel}
                                title={metric.qualifiedWorkLabel}
                                size="sm"
                                class="text-center my-1 max-w-[120px]"
                            />
                            {#if metric.type === MetricType.TICKET_AND_TOTAL}
                                <Input
                                    bind:value={logFormInputs[memberId][metric.id].totalWorkItems}
                                    placeholder={metric.totalWorkLabel}
                                    title={metric.totalWorkLabel} 
                                    size="sm"
                                    class="text-center my-1 max-w-[120px]"
                                />
                            {/if}
                            {#if formValidationErrors[`${memberId}-${metric.id}`]}
                                <ExclamationCircleSolid class="text-red-500 mt-1" />
                                <Tooltip>{formValidationErrors[`${memberId}-${metric.id}`]}</Tooltip>
                            {/if}
                        </div>
                    {/each}
                {:else}
                    {#each displayMetrics as metric (metric.id)}
                        {#if row.logs[memberId]?.[metric.id]}
                            {#if metric.type === MetricType.TICKET_ONLY}
                                {row.logs[memberId][metric.id].qualifiedWorkItems}
                            {:else if row.logs[memberId][metric.id].totalWorkItems === 0}
                                0
                            {:else}
                                {row.logs[memberId][metric.id].qualifiedWorkItems}/{row.logs[memberId][metric.id].totalWorkItems}
                            {/if}
                        {:else}
                            -
                        {/if}
                        <br />
                    {/each}
                {/if}
            </TableBodyCell>
        {/each}

        <TableBodyCell class="align-middle">
            {#if isEditing}
                <div class="flex flex-wrap justify-center gap-2 w-full">
                    <Button type="button" class="py-1 text-sm min-w-[60px]" onclick={handleSave}>Save</Button>
                    <Button type="button" class="py-1 text-sm min-w-[60px]" onclick={toggleEditing}>Cancel</Button>
                </div>
            {:else}
                <div>
                    <button type="button" onclick={toggleEditing} disabled={hasLegacyMetric}>
                        <EditSolid class="dark:text-gray-400 dark:hover:text-white"/>
                    </button>
                    <button type="button" onclick={handleDelete}>
                        <TrashBinSolid class="dark:text-gray-400 dark:hover:text-white"/>
                    </button>
                </div>
            {/if}
        </TableBodyCell>
    </TableBodyRow>
{/if}
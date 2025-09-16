<script lang="ts">
    import { TableBodyRow, TableBodyCell, Input, Button, Tooltip } from "flowbite-svelte";
    import { EditSolid, ExclamationCircleSolid, TrashBinSolid } from "flowbite-svelte-icons";
    import { MetricType, type Team, type Log } from '$lib/types';
    import { onMount } from "svelte";

    export type Row = {
        date: string;
        logs: Record<number, Log>;
    }

    type LogFormInput = {
        id: number | null;
        date: string;
        teamMemberId: number;
        metricId: number;
        qualifiedWorkItems: string;
        totalWorkItems?: string;
        metricType: MetricType;
        qualifiedWorkLabel: string;
        totalWorkLabel?: string | null;
    };

    let { team, teamMemberIds, row, saveRow, deleteRow, isNew } = $props<{
        team: Team;
        teamMemberIds: number[];
        row: Row;
        saveRow: (payload: Log[]) => Promise<boolean>;
        deleteRow: (date: string, logIds: number[]) => void;
        isNew: boolean;
    }>();

    let isEditing = $state(isNew);
    let formInputs = $state<Record<string, LogFormInput>>({});
    let errors = $state<Record<number, string>>({});
    
    function validateForm(): boolean {
        let valid = true;
        const newErrors: Record<number, string> = {};

        for (const input of Object.values(formInputs)) {
            const { teamMemberId, metricType, qualifiedWorkItems, totalWorkItems } = input;
            const tickets = qualifiedWorkItems.trim();
            const total = totalWorkItems?.trim();

            const hasTickets = tickets !== '';
            const hasTotal = total !== '';
            const ticketsNum = Number(tickets);
            const totalNum = Number(total);

            if (hasTickets && (isNaN(ticketsNum) || ticketsNum < 0)) {
                newErrors[teamMemberId] = 'Tickets must be a non-negative number';
                valid = false;
                continue;
            }

            if (metricType === MetricType.TICKET_AND_TOTAL) {
                const bothEmpty = !hasTickets && !hasTotal;
                const bothFilled = hasTickets && hasTotal;

                if (!bothEmpty && !bothFilled) {
                    newErrors[teamMemberId] = 'Both fields must be filled or both empty';
                    valid = false;
                    continue;
                }
                
                if (hasTotal && (isNaN(totalNum) || totalNum < 0)) {
                    newErrors[teamMemberId] = 'Total must be a non-negative number';
                    valid = false;
                    continue;
                }

                if (hasTickets && hasTotal && ticketsNum > totalNum) {
                    newErrors[teamMemberId] = 'Tickets cannot exceed total';
                    valid = false;
                    continue;
                }
            }
        }

        errors = newErrors;
        return valid;
    }

    async function handleSave() {
        if (!validateForm()) 
            return;

        const payload: Log[] = Object.values(formInputs)
            .filter(item => item.qualifiedWorkItems !== '')
            .map(item => ({
                id: item.id,
                date: item.date,
                teamMemberId: item.teamMemberId,
                metricId: item.metricId,
                qualifiedWorkItems: Number(item.qualifiedWorkItems),
                totalWorkItems: item.totalWorkItems === '' ? null : Number(item.totalWorkItems),
                qualifiedWorkLabel: item.qualifiedWorkLabel,
                totalWorkLabel: item.totalWorkLabel || null,
                isLegacy: false,
                metricType: team.type
            }));

        const success = await saveRow(payload);
        if (success)
            toggleEditing();
    }

    function handleDelete() {
        const logIds = (Object.values(row.logs) as Log[]).map(item => item.id);
        deleteRow(row.date, team.name, logIds);
    }
      
    function toggleEditing() {
        isEditing = !isEditing;
    }

    onMount(() => {
        const initialInputs: Record<string, LogFormInput> = {};
        for (const teamMemberId of teamMemberIds) {
            const existing = row.logs[teamMemberId];
            initialInputs[teamMemberId] = existing
                ? {
                    ...existing,
                    qualifiedWorkItems: existing.qualifiedWorkItems != null ? String(existing.qualifiedWorkItems) : '',
                    totalWorkItems: existing.totalWorkItems != null ? String(existing.totalWorkItems) : ''
                }
                : {
                    date: row.date,
                    teamMemberId,
                    qualifiedWorkItems: '',
                    totalWorkItems: ''
                };
        }
        formInputs = initialInputs;
    });
</script>

<TableBodyRow class="items-center">
    <TableBodyCell class="px-2 text-center">{row.date}</TableBodyCell>
    
    {#each teamMemberIds as teamMemberId (teamMemberId)}
        {@const log = row.logs[teamMemberId]}
        <TableBodyCell class="border dark:border-gray-700 p-2">
            {#if isEditing}
                {#if formInputs[teamMemberId]}
                    <div class="relative flex justify-center items-center">
                        <div>
                            <Input
                                bind:value={formInputs[teamMemberId].qualifiedWorkItems}
                                placeholder={formInputs[teamMemberId].qualifiedWorkLabel}
                                title={formInputs[teamMemberId].qualifiedWorkLabel}
                                size="sm"
                                class="text-center mb-1"
                            />
                            {#if formInputs[teamMemberId].metricType == MetricType.TICKET_AND_TOTAL}
                                <Input
                                    bind:value={formInputs[teamMemberId].totalWorkItems}
                                    placeholder={formInputs[teamMemberId].totalWorkLabel || 'Total'}
                                    title={formInputs[teamMemberId].totalWorkLabel || 'Total Work Items'} 
                                    size="sm"
                                    class="text-center mt-1"
                                />
                            {/if}
                        </div>
                        {#if errors[teamMemberId]}
                            <ExclamationCircleSolid class="text-red-500 ml-1" />
                            <Tooltip>{errors[teamMemberId]}</Tooltip>
                        {/if}
                    </div>
                {:else}
                    <span class="text-sm text-gray-400">Loading...</span>
                {/if}
            {:else}
                {#if log == null || log.qualifiedWorkItems == null || log.qualifiedWorkItems === ""}
                    -
                {:else if log.metricType === MetricType.TICKET_ONLY}
                    {log.qualifiedWorkItems}
                {:else if log.totalWorkItems === 0}
                    0
                {:else}
                    {log.qualifiedWorkItems}/{log.totalWorkItems}
                {/if}
            {/if}
        </TableBodyCell>
    {/each}

    <TableBodyCell class="flex justify-center items-center">
        {#if isEditing}
            <div class="flex flex-wrap justify-center gap-2 w-full">
                <Button type="button" class="py-1 text-sm min-w-[60px]" onclick={handleSave}>Save</Button>
                <Button type="button" class="py-1 text-sm min-w-[60px]" onclick={toggleEditing}>Cancel</Button>
            </div>
        {:else}
            <div>
                <button type="button" onclick={toggleEditing}>
                    <EditSolid class="dark:text-gray-400 dark:hover:text-white"/>
                </button>
                <button type="button" onclick={handleDelete}>
                    <TrashBinSolid class="dark:text-gray-400 dark:hover:text-white"/>
                </button>
            </div>
        {/if}
    </TableBodyCell>
</TableBodyRow>

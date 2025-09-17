<script lang="ts">
    import { onMount } from 'svelte';
    import { Button, Modal } from 'flowbite-svelte';
    import { EditSolid, TrashBinSolid } from 'flowbite-svelte-icons';
    import { showAlert } from '$lib/stores/alert';
    import { type Metric, type Team, MetricType } from '$lib/types';
    import { MetricTypeLabels } from '$lib/types';

    export let metrics: Metric[] = [];
    export let teams: Team[] = [];
    export let onMetricsChange: (metrics: Metric[]) => void;

    type EditForm = {
        id: number | null;
        teamId: number | '';
        qualifiedWorkLabel: string;
        totalWorkLabel: string;
        type: MetricType;
    };

    let isLoading = true;
    let editModal = false;
    let editForm: EditForm = {
        id: null,
        teamId: '',
        qualifiedWorkLabel: '',
        totalWorkLabel: '',
        type: MetricType.TICKET_ONLY
    };
    let deleteModal = false;
    let toDelete: Metric | null = null;

    function sortMetrics(list: Metric[]) {
        return list.slice().sort((a, b) => {
            if (a.teamId !== b.teamId) return a.teamId - b.teamId;
            return a.qualifiedWorkLabel.localeCompare(b.qualifiedWorkLabel);
        });
    }

    function openEdit(metric: Metric) {
        editForm = {
            id: metric.id,
            teamId: metric.teamId ?? '',
            qualifiedWorkLabel: metric.qualifiedWorkLabel,
            totalWorkLabel: metric.totalWorkLabel ?? '',
            type: metric.type
        };
        editModal = true;
    }

    function openDelete(metric: Metric) {
        toDelete = metric;
        deleteModal = true;
    }

    async function fetchMetrics() {
        try {
            const res = await fetch('/api/metrics');
            const data = await res.json();

            if (res.ok && Array.isArray(data)) {
                onMetricsChange(sortMetrics(data));
            } else {
                throw new Error('Unexpected response format');
            }
        } catch (err) {
            console.error('Error fetching metrics:', err);
            showAlert('Failed to load metrics');
        } finally {
            isLoading = false;
        }
    }

    async function updateMetric() {
        if (!editForm.id) return;

        const payload = {
            id: editForm.id,
            teamId: editForm.teamId || null,
            qualifiedWorkLabel: editForm.qualifiedWorkLabel.trim(),
            totalWorkLabel: editForm.totalWorkLabel.trim(),
            type: editForm.type
        };

        try {
            const res = await fetch('/api/metrics', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error(await res.text());

            const updated: Metric = await res.json();
            onMetricsChange(
                sortMetrics(metrics.map(m => m.id === updated.id ? updated : m))
            );
            editModal = false;
        } catch (err) {
            console.error('Error updating metric:', err);
            showAlert('Error updating metric');
        }
    }

    async function deleteMetric(id: number) {
        try {
            const res = await fetch(`/api/metrics?id=${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error(await res.text());

            onMetricsChange(sortMetrics(metrics.filter(m => m.id !== id)));
            deleteModal = false;
        } catch (err) {
            console.error('Error deleting metric:', err);
            showAlert('Error deleting metric');
        }
    }

    onMount(fetchMetrics);
</script>

<section class="m-2 p-4 bg-gray-800 rounded-lg shadow-md">
    <h2 class="text-xl font-bold mb-4 dark:text-gray-200 text-center">Metrics</h2>

    {#if isLoading}
        <div class="text-center py-8 text-gray-500 dark:text-gray-400">
            Loading metrics...
        </div>
    {:else}
        <div class="max-h-full overflow-x-auto border-2 dark:border-gray-700">
            <div class="max-h-[500px] overflow-y-auto">
                <table class="admin-table text-center text-xs md:text-base dark:text-gray-800 min-w-full">
                    <thead class="text-xs uppercase">
                        <tr class="dark:text-gray-400">
                            <th>Team</th>
                            <th>Type</th>
                            <th>Qualified Work Items</th>
                            <th>Total Work Items</th>
                            <th>Edit</th>
                        </tr>
                    </thead>
                    <tbody class="dark:text-gray-400">
                        {#each metrics as metric (metric.id)}
                            <tr>
                                <td>{teams.find(t => t.id === metric.teamId)?.name ?? '-'}</td>
                                <td>{MetricTypeLabels[metric.type] ?? '-'}</td>
                                <td>{metric.qualifiedWorkLabel}</td>
                                <td>{metric.totalWorkLabel ?? '-'}</td>
                                <td>
                                    <button type="button" onclick={() => openEdit(metric)}>
                                        <EditSolid class="dark:text-gray-400 dark:hover:text-white"/>
                                    </button>
                                    <button type="button" onclick={() => openDelete(metric)}>
                                        <TrashBinSolid class="dark:text-gray-400 dark:hover:text-white"/>
                                    </button>
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        </div>
    {/if}
</section>

<Modal bind:open={editModal}>
    <h3 class="text-center text-lg font-semibold mb-4">
        Update Metric
    </h3>

    <div class="flex flex-col gap-y-3">
        <label>
            Team
            <select bind:value={editForm.teamId} class="custom-select">
                <option value="">Select Team</option>
                {#each teams as team}
                    <option value={team.id}>{team.name}</option>
                {/each}
            </select>
        </label>
    
        <label>
            Qualified Work Items Name
            <input type="text" bind:value={editForm.qualifiedWorkLabel} class="custom-input" />
        </label>
    
        <label>
            Total Work Items Name
            <input type="text" bind:value={editForm.totalWorkLabel} class="custom-input" />
        </label>
    
        <label>
            Type
            <select bind:value={editForm.type} class="custom-select">
                {#each Object.values(MetricType) as typeVal}
                    <option value={typeVal}>{MetricTypeLabels[typeVal]}</option>
                {/each}
            </select>
        </label>
    </div>

    <div class="flex justify-center gap-2 mt-4">
        <Button onclick={updateMetric}>Update</Button>
        <Button color="alternative" onclick={() => (editModal = false)}>Cancel</Button>
    </div>
</Modal>

<Modal bind:open={deleteModal}>
    <p class="text-center">
        Delete metric for <strong>{teams.find(t => t.id === toDelete?.teamId)?.name ?? '-'}</strong>?<br />
        <span class="text-red-400">This action cannot be undone.</span>
    </p>
    <div class="flex justify-center gap-2">
        <Button onclick={() => toDelete && deleteMetric(toDelete.id)}>Delete</Button>
        <Button color="alternative" onclick={() => (deleteModal = false)}>Cancel</Button>
    </div>
</Modal>

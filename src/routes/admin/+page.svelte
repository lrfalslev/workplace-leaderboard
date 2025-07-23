<script lang="ts">
    import { onMount } from "svelte";
    import { Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell, Tooltip, Button, Input, table } from "flowbite-svelte";
    import {  EditSolid, TrashBinSolid, CalendarPlusSolid } from "flowbite-svelte-icons";
    import type { Placement } from "@floating-ui/utils";

    interface Topview {
        date: string;
        coordinator: string;
        coordinatorId: number,
        firstTimeApprovals: number;
        totalSubmissions: number;
    }

    let name = '';
    let date = new Date().toLocaleDateString('en-CA');
    console.log(date);

    let coordinators: { id: number; name: string }[] = [];
    let tableRows: Map<string, Topview[]> = new Map();

    async function fetchTopviews() {
        coordinators = [];
        tableRows = new Map();
        try {
            const response = await fetch('/api/topviews');
            const json = await response.json();

            if (response.ok && Array.isArray(json)) {
                const topviews = json as Topview[];

                for (const topview of topviews) {
                    if (!coordinators.find(c => c.id === topview.coordinatorId)) {
                        coordinators.push({
                            id: topview.coordinatorId,
                            name: topview.coordinator
                        });
                    }

                    if (!topview.date) continue;

                    if (!tableRows.has(topview.date)) {
                        tableRows.set(topview.date, []);
                    }
                    tableRows.get(topview.date)!.push(topview);
                }
            } else {
                console.error('Unexpected topviews format.', json);
            }
        } catch (err) {
            console.error('Failed to fetch topviews.', err);
        }
        tableRows = new Map(tableRows);
        coordinators = [...coordinators];
    }

    async function addCoordinator() {
        const trimmed = name.trim();
        if (!trimmed) return;

        try {
            const response = await fetch('/api/project-coordinators', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name: trimmed })
            });

            if (!response.ok) {
                alert('❌ Could not add project coordinator. Please try again.');
                return;
            }

            name = '';
            await fetchTopviews();
        } catch (err) {
            console.error('Error adding project coordinator.', err);
            alert('❌ Could not add project coordinator. Please try again.');
        }
    }

    async function deleteCoordinator(id: number) {
        try {
            const response = await fetch(`/api/project-coordinators?id=${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                alert('❌ Could not delete project coordinator. Please try again.');
            }

            await fetchTopviews();
        } catch (err) {
            console.error('Error deleting coordinator.', err);
            alert('❌ Could not delete project coordinator. Please try again.');
        }
    }

    function addEmptyRow() {
        tableRows.set(date, []);
        tableRows = tableRows;
    }

    function updateValue(rowIdx: number, coordId: number, input: string) {
        const [first, total] = input.split('/').map(n => parseInt(n) || 0);
        editableTable[rowIdx].data[coordId] = {
            firstTimeApprovals: first,
            totalSubmissions: total
        };
    }

    async function submitRow(row: EditableRow) {
        const payload = [];

        for (const c of coordinators) {
            const entry = row.data[c.id];
            if (!entry) continue;

            payload.push({
                projectCoordinatorId: c.id,
                date: row.date,
                firstTimeApprovals: entry.firstTimeApprovals,
                totalSubmissions: entry.totalSubmissions
            });
        }

        try {
            const res = await fetch('/api/topviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                alert('✅ Row saved!');
                await fetchTopviews();
            } else {
                alert('❌ Save failed');
            }
        } catch (err) {
            console.error('Submission error:', err);
        }
    }

    onMount(() => {
        fetchTopviews();
    });
</script>

<div>
    <div class="flex items-center gap-2 w-1/2">
        <Input bind:value={name} type="text" placeholder="coordinator name" class="flex-1" onkeydown={(e) => e.key === 'Enter' && addCoordinator()}/>
        <Button onclick={addCoordinator}>Add PC</Button>
    </div>
    <div class="flex items-center gap-2 w-1/2">
        <Input bind:value={date} type="date" class="flex-1" onkeydown={(e) => e.key === 'Enter' && addEmptyRow()}/>
        <Button onclick={addEmptyRow}>Add Date</Button>
    </div>
    <Table class="text-center">
      <TableHead>
        <TableHeadCell>Date</TableHeadCell>
        {#each coordinators as coordinator}
            <TableHeadCell class="group">
                <div class="flex items-center gap-2">
                    {coordinator.name}
                    <EditSolid class="opacity-0 group-hover:opacity-100 dark:text-gray-400 dark:hover:text-white cursor-pointer" />
                    <Tooltip type="dark">Edit</Tooltip>
                    <Button onclick={() => deleteCoordinator(coordinator.id)}>
                        <TrashBinSolid class="dark:text-gray-400 dark:hover:text-red-800" />
                    </Button>
                </div>
            </TableHeadCell>
        {/each} 
        <TableHeadCell> 
            <span class="sr-only">Edit</span> 
        </TableHeadCell>
      </TableHead>
      <TableBody>
        {#each Array.from(tableRows.entries()) as [date, topviews]}
            <TableBodyRow>
                <TableBodyCell>{date}</TableBodyCell>
                {#each coordinators as coordinator}
                    {#if topviews.find(tv => tv.coordinatorId === coordinator.id)}
                        {#each topviews.filter(tv => tv.coordinatorId === coordinator.id) as topview}
                            <TableBodyCell>{topview.firstTimeApprovals}/{topview.totalSubmissions}</TableBodyCell>
                        {/each}
                    {:else}
                        <TableBodyCell class="text-gray-400">—</TableBodyCell>
                    {/if}
                {/each}
                <TableBodyCell>
                    <a href="/tables" class="text-primary-600 dark:text-primary-500 font-medium hover:underline">Save</a>
                </TableBodyCell>
            </TableBodyRow>
        {/each}
      </TableBody>
    </Table>
</div>

<!-- <div>
    {#each coordinators as coordinator}
      <div style="display: flex; align-items: center; gap: 0.5rem;">
        <span>{coordinator.name}</span>
        <button
          on:click={() => deleteCoordinator(coordinator.id)}
          style="background-color: red; color: white; border: none; padding: 0.25rem 0.5rem; border-radius: 4px; cursor: pointer;"
        >
          Delete
        </button>
      </div>
    {/each}

    <div style="margin-bottom: 1rem;">
        <input
            bind:value={name}
            placeholder="Enter coordinator name"
            style="padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px;"
        />
        <button
            on:click={() => addCoordinator()}
            style="margin-left: 0.5rem; background-color: #0d6efd; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px;"
        >
            Add
        </button>
    </div>
</div>

<button on:click={addEmptyRow} style="margin-bottom: 1rem;">
    Add Row for Today
</button>

<table>
    <thead>
        <tr>
            <th>Date</th>
            {#each coordinators as coordinator}
                <th>{coordinator.name}</th>
            {/each}
            <th>Action</th>
        </tr>
    </thead>
    <tbody>
        {#each editableTable as row, i}
            <tr>
                <td>
                    <input
                        type="date"
                        bind:value={editableTable[i].date}
                        style="width: 140px;"
                    />
                </td>

                {#each coordinators as coordinator}
                    <td>
                        <input
                            value={formatCell(i, coordinator.id)}
                            on:input={(e) => updateValue(i, coordinator.id, (e.target as HTMLInputElement).value)}
                            style="width: 100px;"
                        />
                    </td>
                {/each}

                <td>
                    <button
                        on:click={() => submitRow(editableTable[i])}
                        style="background-color: #198754; color: white; border: none; padding: 0.4rem 0.6rem; border-radius: 4px; cursor: pointer;"
                    >
                        Save
                    </button>
                </td>
            </tr>
        {/each}
    </tbody>
</table> -->

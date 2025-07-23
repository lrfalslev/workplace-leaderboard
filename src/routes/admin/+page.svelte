<script lang="ts">
    import { onMount } from "svelte";
    import { Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell, Tooltip, Button, Input, Modal, Popover } from "flowbite-svelte";
    import {  EditSolid, TrashBinSolid, CalendarPlusSolid } from "flowbite-svelte-icons";
    import type { Placement } from "@floating-ui/utils";

    interface Topview {
        date: string;
        coordinator: string;
        coordinatorId: number,
        firstTimeApprovals: number;
        totalSubmissions: number;
    }

    interface Coordinator {
        id: number;
        name: string;
    }

    let name = '';
    let date = new Date().toLocaleDateString('en-CA');
    let editModal = false;
    let selectedCoordinator: Coordinator | null = null;
    let updatedName = '';
    let deleteModal = false;

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

    async function editCoordinator() {
        const trimmed = updatedName.trim();
        if (!trimmed || !selectedCoordinator) return;

        try {
            const response = await fetch('/api/project-coordinators', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: selectedCoordinator.id, name: trimmed })
            });

            if (!response.ok) {
                alert('❌ Could not update name. Please try again.');
                return;
            }

            selectedCoordinator = null;
            updatedName = '';
            await fetchTopviews();
        } catch (err) {
            console.error('Error editing project coordinator.', err);
            alert('❌ Could not update name. Please try again.');
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
    <div class="flex items-center">
        <div class="flex gap-2 w-1/2 m-2">
            <Input bind:value={name} type="text" placeholder="coordinator name" class="flex-1" onkeydown={(e) => e.key === 'Enter' && addCoordinator()}/>
            <Button class="cursor-pointer" onclick={addCoordinator}>Add PC</Button>
        </div>
        <div class="flex gap-2 w-1/2 m-2">
            <Input bind:value={date} type="date" class="flex-1" onkeydown={(e) => e.key === 'Enter' && addEmptyRow()}/>
            <Button class="cursor-pointer" onclick={addEmptyRow}>Add Date</Button>
        </div>
    </div>
    <Table class="text-center">
      <TableHead>
        <TableHeadCell>Date</TableHeadCell>
        {#each coordinators as coordinator}
            <TableHeadCell class="group relative">
                <div class="flex items-center gap-2">
                    {coordinator.name}
                    <Popover>
                        <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button class="cursor-pointer" onclick={() => {
                                selectedCoordinator = coordinator;
                                updatedName = coordinator.name;
                                editModal = true;
                            }}>
                                <EditSolid class="dark:text-gray-400 dark:hover:text-white" />
                            </button>
                            <button class="cursor-pointer" onclick={() => {
                                selectedCoordinator = coordinator;
                                deleteModal = true;
                            }}>
                                <TrashBinSolid class="dark:text-gray-400 dark:hover:text-red-800" />
                            </button>
                        </div>
                    </Popover>
                </div>
            </TableHeadCell>
        {/each} 
        <TableHeadCell> 
            <span class="sr-only">Edit</span> 
        </TableHeadCell>
      </TableHead>
      <TableBody>
        {#each Array.from(tableRows.entries()).sort((a, b) => b[0].localeCompare(a[0])) as [date, topviews]}
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
    <Modal form bind:open={editModal} size="xs" class="pt-8 text-center" onaction={async ({ action }) => {
        if (action === 'success' && selectedCoordinator) {
            {editCoordinator()}
            editModal = false;
        } else if (action === 'decline') {
            editModal = false;
            selectedCoordinator = null;
        }
        }}>
        <Input bind:value={updatedName} type="text" name="coordinator" required  />
        <Button class="mr-1" type="submit" value="success">Save</Button>
        <Button type="submit" value="decline" color="alternative">Cancel</Button>
    </Modal>
    <Modal form bind:open={deleteModal} size="xs" class="pt-8 text-center" onaction={async ({ action }) => {
        if (action === 'success' && selectedCoordinator) {
            {deleteCoordinator(selectedCoordinator.id)}
            deleteModal = false;
        } else if (action === 'decline') {
            deleteModal = false;
            selectedCoordinator = null;
        }
        }}>
        <p>
            Delete <strong>{selectedCoordinator?.name}</strong> and all their topviews?<br />
            <span class="text-red-400">This action cannot be undone.</span>
        </p>
        <Button class="mr-2" type="submit" value="success">Delete</Button>
        <Button type="submit" value="decline" color="alternative">Cancel</Button>
    </Modal>
</div>

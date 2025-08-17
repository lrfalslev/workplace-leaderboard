<script lang="ts">
    import { onMount } from "svelte";
    import { Table, TableBody, TableHead, TableHeadCell, Button, Input, Modal, Popover } from "flowbite-svelte";
    import {  EditSolid, TrashBinSolid } from "flowbite-svelte-icons";
    import EditableRow from "./components/EditableRow.svelte";
    import type { Topview, Coordinator } from '$lib/types';
    
    let name = $state('');
    let date = new Date().toLocaleDateString('en-CA');
    
    let editModal = $state(false);
    let deleteModal = $state(false);
    let selectedCoordinator: Coordinator | null = null;
    let updatedName = $state('');

    let coordinators: Coordinator[] = $state([]);
    let topviewsArray: Array<Record<string | number, any>> = $state([]);

    async function fetchCoordinators() {
        try {
            const response = await fetch('/api/project-coordinators');
            const data = await response.json();

            if (response.ok && Array.isArray(data)) {
                coordinators = data.sort((a, b) => a.name.localeCompare(b.name));
            } else {
                console.error('Unexpected response format:', data);
            }
        } catch (err) {
            console.error('Failed to fetch topviews:', err);
        }
    }

    async function fetchTopviews() {
        try {
            const response = await fetch('/api/topviews');
            const json = await response.json();

            if (response.ok && Array.isArray(json)) {
                const topviewsRaw = json as Topview[];
                
                for (const topview of topviewsRaw) {
                    let dayEntry = topviewsArray.find(entry => entry.date === topview.date);

                    if (!dayEntry) {
                        dayEntry = { date: topview.date };
                        topviewsArray.push(dayEntry);
                    }
                    
                    dayEntry[topview.coordinatorId] = {
                        firstTimeApprovals: topview.firstTimeApprovals,
                        totalSubmissions: topview.totalSubmissions
                    };
                }

                topviewsArray.sort((a, b) => b.date.localeCompare(a.date));

            } else {
                console.error('Unexpected topviews format.', json);
            }
        } catch (err) {
            console.error('Failed to fetch topviews.', err);
        }
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
            fetchCoordinators();
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

            selectedCoordinator.name = trimmed;
            selectedCoordinator = null;
            updatedName = '';
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

            const index = coordinators.findIndex(c => c.id === id);
            if (index !== -1) {
                coordinators.splice(index, 1);
            }
        } catch (err) {
            console.error('Error deleting coordinator.', err);
            alert('❌ Could not delete project coordinator. Please try again.');
        }
    }

    function addNewRow() {
        let dayEntry = topviewsArray.find(entry => entry.date === date);

        if (!dayEntry) {
            dayEntry = { date: date };
            topviewsArray.unshift(dayEntry);
        }
    }

    onMount(() => {
        fetchCoordinators();
        fetchTopviews();
    });
</script>

<div class="max-h-[80vh] overflow-y-auto  w-[80vw] max-w-full table-fixed mx-auto">
    <div class="flex items-center sticky top-0 z-30 mb-2 bg-gray-700">
        <div class="flex gap-2 w-1/2 m-2">
            <Input bind:value={name} type="text" placeholder="coordinator name" class="flex-1" onkeydown={(e) => e.key === 'Enter' && addCoordinator()}/>
            <Button class="cursor-pointer" onclick={addCoordinator}>Add PC</Button>
        </div>
        <div class="flex gap-2 w-1/2 m-2">
            <Input bind:value={date} type="date" class="flex-1" onkeydown={(e) => e.key === 'Enter' && addNewRow()}/>
            <Button class="cursor-pointer" onclick={addNewRow}>Add Date</Button>
        </div>
    </div>
    <Table class="text-center w-full">
        <TableHead>
            <TableHeadCell>Date</TableHeadCell>
            {#each coordinators as coordinator}
                <TableHeadCell class="group relative">
                    <div class="flex justify-center gap-2">
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
            {#each topviewsArray as topviews}
                <EditableRow {coordinators} {topviews} />
            {/each}
        </TableBody>
    </Table>
</div>
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

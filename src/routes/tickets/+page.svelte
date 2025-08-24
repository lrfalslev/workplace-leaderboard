<script lang="ts">
    import { onMount } from "svelte";
    import { Table, TableBody, TableHead, TableHeadCell, Button, Input, Modal, Popover } from "flowbite-svelte";
    import {  EditSolid, TrashBinSolid } from "flowbite-svelte-icons";
    import EditableRow from "./components/EditableRow.svelte";
    import type { Topview, TeamMember } from '$lib/types';
    import { showAlert } from "$lib/stores/alert";
    
    let name = $state('');
    let date = new Date().toLocaleDateString('en-CA');
    
    let editModal = $state(false);
    let deleteTeamMemberModal = $state(false);
    let deleteTopviewModal = $state(false);
    let selectedTeamMember: TeamMember | null = null;
    let updatedName = $state('');
    let selectedDate: string | null = null

    let teamMembers: TeamMember[] = $state([]);
    let topviewsArray: Array<Record<string | number, any>> = $state([]);

    async function fetchTeamMembers() {
        try {
            const response = await fetch('/api/team-members');
            const data = await response.json();

            if (response.ok && Array.isArray(data)) {
                teamMembers = data.sort((a, b) => a.name.localeCompare(b.name));
            } else {
                console.error('Unexpected response format: ', data);
            }
        } catch (err) {
            console.error('Failed to fetch topviews: ', err);
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
                    
                    dayEntry[topview.teamMemberId] = {
                        firstTimeApprovals: topview.firstTimeApprovals,
                        totalSubmissions: topview.totalSubmissions
                    };
                }

                topviewsArray.sort((a, b) => b.date.localeCompare(a.date));

            } else {
                console.error('Unexpected topviews format: ', json);
            }
        } catch (err) {
            console.error('Failed to fetch topviews: ', err);
        }
    }

    async function addTeamMember() {
        const trimmed = name.trim();
        if (!trimmed) return;

        try {
            const response = await fetch('/api/team-members', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name: trimmed })
            });

            if (!response.ok) {
                throw new Error(await response.text());
            }

            name = '';
            fetchTeamMembers();
        } catch (err) {
            console.error('Error adding project team member: ', err);
            showAlert("Could not add project team member. Please try again.");
        }
    }

    async function editTeamMember() {
        const trimmed = updatedName.trim();
        if (!trimmed || !selectedTeamMember) return;

        try {
            const response = await fetch('/api/team-members', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: selectedTeamMember.id, name: trimmed })
            });

            if (!response.ok) {
                throw new Error(await response.text());
            }

            selectedTeamMember.name = trimmed;
            selectedTeamMember = null;
            updatedName = '';
        } catch (err) {
            console.error('Error editing team member: ', err);
            showAlert('Could not update name. Please try again.');
        }
    }

    async function deleteTeamMember(id: number) {
        try {
            const response = await fetch(`/api/team-members?id=${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error(await response.text());
            }

            const index = teamMembers.findIndex(member => member.id === id);
            if (index !== -1) {
                teamMembers.splice(index, 1);
            }
        } catch (err) {
            console.error('Error deleting team member: ', err);
            showAlert('Could not delete team member. Please try again.');
        }
    }
    
    async function deleteTopviews(date: string) {
        try {
            const response = await fetch(`/api/topviews`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date })
            });

            if (!response.ok) {
                throw new Error(await response.text());
            }

            const index = topviewsArray.findIndex(entry => entry.date === date);
            if (index !== -1) {
                topviewsArray.splice(index, 1);
            }
        } catch (err) {
            console.error('Error deleting topviews: ', err);
            showAlert('Could not delete topviews. Please try again.');
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
        fetchTeamMembers();
        fetchTopviews();
    });
</script>

<div class="max-h-[80vh] overflow-y-auto  w-[80vw] max-w-full table-fixed mx-auto">
    <div class="flex items-center sticky top-0 z-30 mb-2 bg-gray-700">
        <div class="flex gap-2 w-1/2 m-2">
            <Input bind:value={name} type="text" placeholder="team member name" class="flex-1" onkeydown={(e) => e.key === 'Enter' && addTeamMember()}/>
            <Button onclick={addTeamMember}>Add PC</Button>
        </div>
        <div class="flex gap-2 w-1/2 m-2">
            <Input bind:value={date} type="date" class="flex-1" onkeydown={(e) => e.key === 'Enter' && addNewRow()}/>
            <Button onclick={addNewRow}>Add Date</Button>
        </div>
    </div>
    <Table class="text-center w-full">
        <TableHead>
            <TableHeadCell>Date</TableHeadCell>
            {#each teamMembers as teamMember}
                <TableHeadCell class="group relative">
                    <div class="flex justify-center gap-2">
                        {teamMember.name}
                        <Popover>
                            <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onclick={() => {
                                    selectedTeamMember = teamMember;
                                    updatedName = teamMember.name;
                                    editModal = true;
                                }}>
                                    <EditSolid class="dark:text-gray-400 dark:hover:text-white" />
                                </button>
                                <button onclick={() => {
                                    selectedTeamMember = teamMember;
                                    deleteTeamMemberModal = true;
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
                <EditableRow {teamMembers} {topviews}>
                    <button
                        slot="actions"
                        onclick={() => {
                            selectedDate = topviews.date;
                            deleteTopviewModal = true;
                        }}
                    >
                        <TrashBinSolid class="dark:text-gray-400 dark:hover:text-red-800" />
                    </button>
                </EditableRow>
            {/each}
        </TableBody>
    </Table>
</div>
<Modal form bind:open={editModal} size="xs" class="pt-8 text-center" onaction={async ({ action }) => {
    if (action === 'success' && selectedTeamMember) {
        {editTeamMember()}
        editModal = false;
    } else if (action === 'decline') {
        editModal = false;
        selectedTeamMember = null;
    }
    }}>
    <Input bind:value={updatedName} type="text" name="teamMember" required  />
    <Button class="mr-1" type="submit" value="success">Save</Button>
    <Button type="submit" value="decline" color="alternative">Cancel</Button>
</Modal>
<Modal form bind:open={deleteTeamMemberModal} size="xs" class="pt-8 text-center" onaction={async ({ action }) => {
    if (action === 'success' && selectedTeamMember) {
        {deleteTeamMember(selectedTeamMember.id)}
        deleteTeamMemberModal = false;
    } else if (action === 'decline') {
        deleteTeamMemberModal = false;
        selectedTeamMember = null;
    }
    }}>
    <p>
        Delete <strong>{selectedTeamMember?.name}</strong> and all their topviews?<br />
        <span class="text-red-400">This action cannot be undone.</span>
    </p>
    <Button class="mr-2" type="submit" value="success">Delete</Button>
    <Button type="submit" value="decline" color="alternative">Cancel</Button>
</Modal>
<Modal form bind:open={deleteTopviewModal} size="xs" class="pt-8 text-center" onaction={async ({ action }) => {
    if (action === 'success' && selectedDate) {
        {deleteTopviews(selectedDate)}
        deleteTopviewModal = false;
    } else if (action === 'decline') {
        deleteTopviewModal = false;
        selectedTeamMember = null;
    }
    }}>
    <p>
        Delete all topviews for date <strong>{selectedDate}</strong>?<br />
        <span class="text-red-400">This action cannot be undone.</span>
    </p>
    <Button class="mr-2" type="submit" value="success">Delete</Button>
    <Button type="submit" value="decline" color="alternative">Cancel</Button>
</Modal>

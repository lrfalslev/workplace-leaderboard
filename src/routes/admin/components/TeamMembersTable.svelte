<script lang="ts">
    import { onMount } from 'svelte';
    import { Button, Modal } from 'flowbite-svelte';
    import { EditSolid, TrashBinSolid } from 'flowbite-svelte-icons';
    import { showAlert } from '$lib/stores/alert';
    import type { TeamMember, Team } from '$lib/types';

    export let teamMembers: TeamMember[] = [];
    export let teams: Team[] = [];
    export let onTeamMembersChange: (members: TeamMember[]) => void;

    type EditForm = {
        id: number | null;
        name: string;
        teamId: number | '';
    };

    let isLoading = true;

    //create
    let newMember: EditForm = { id: null, name: '', teamId: '' };
    
    //update
    let editModal = false;
    let editForm: EditForm = { id: null, name: '', teamId: '' };
    
    //delete
    let deleteModal = false;
    let toDelete: TeamMember | null = null;

    function sortTeamMembers(list: TeamMember[]) {
        return list.slice().sort((a, b) => {
            if (a.teamId !== b.teamId) return a.teamId - b.teamId;
            return a.name.localeCompare(b.name);
        });
    }

    function openEdit(member: TeamMember) {
        editForm = {
            id: member.id,
            name: member.name,
            teamId: member.teamId ?? ''
        };
        editModal = true;
    }

    function openDelete(member: TeamMember) {
        toDelete = member;
        deleteModal = true;
    }

    async function fetchTeamMembers() {
        try {
            const res = await fetch('/api/team-members');
            const data = await res.json();

            if (res.ok && Array.isArray(data)) {
                onTeamMembersChange(sortTeamMembers(data));
            } else {
                throw new Error('Unexpected response format');
            }
        } catch (err) {
            console.error('Error fetching team members:', err);
            showAlert('Failed to load team members');
        } finally {
            isLoading = false;
        }
    }

    async function addTeamMember(e: SubmitEvent) {
        e.preventDefault();
        if (!newMember.name.trim()) {
            showAlert('Member name is required.');
            return;
        }
        try {
            const res = await fetch('/api/team-members', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newMember.name.trim(),
                    teamId: newMember.teamId || null
                })
            });

            if (!res.ok) 
                throw new Error(await res.text());

            const created: TeamMember = await res.json();
            onTeamMembersChange(sortTeamMembers([...teamMembers, created]));
            newMember = { id: null, name: '', teamId: '' };
        } catch (err) {
            console.error('Error adding team member:', err);
            showAlert('Error adding team member');
        }
    }

    async function updateTeamMember() {
        if (!editForm.id) return;

        const payload = {
            teamMemberId: editForm.id,
            name: editForm.name.trim(),
            teamId: editForm.teamId || null
        };

        try {
            const res = await fetch('/api/team-members', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error(await res.text());

            const updated: TeamMember = await res.json();
            onTeamMembersChange(
                sortTeamMembers(teamMembers.map(m => m.id === updated.id ? updated : m))
            );
            editModal = false;
        } catch (err) {
            console.error('Error updating team member:', err);
            showAlert('Error updating team member');
        }
    }

    async function deleteTeamMember(id: number) {
        try {
            const res = await fetch(`/api/team-members?id=${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error(await res.text());

            onTeamMembersChange(sortTeamMembers(teamMembers.filter(m => m.id !== id)));
            deleteModal = false;
        } catch (err) {
            console.error('Error deleting team member:', err);
            showAlert('Error deleting team member');
        }
    }

    onMount(fetchTeamMembers);
</script>

<section class="m-2 p-4 bg-gray-800 rounded-lg shadow-md">
    <h2 class="text-xl font-bold mb-4 dark:text-gray-200 text-center">Team Members</h2>

    <form class="flex flex-row flex-nowrap justify-center items-center gap-2 mb-4 overflow-x-auto"
        onsubmit={addTeamMember}>
        <select bind:value={newMember.teamId} class="custom-select">
            <option value="">No Team</option>
            {#each teams as team}
                <option value={team.id}>{team.name}</option>
            {/each}
        </select>
        <input type="text" class="custom-input" placeholder="Member Name" bind:value={newMember.name} />
        <Button type="submit">Add</Button>
    </form>

    {#if isLoading}
        <div class="text-center py-8 text-gray-500 dark:text-gray-400">
            Loading team members...
        </div>
    {:else}
        <div class="max-h-full overflow-x-auto border-2 dark:border-gray-700">
            <div class="max-h-[500px] overflow-y-auto">
                <table class="admin-table text-center text-xs md:text-base dark:text-gray-800 min-w-full">
                    <thead class="text-xs uppercase">
                        <tr class="dark:text-gray-400">
                            <th>Name</th>
                            <th>Team</th>
                            <th>Edit</th>
                        </tr>
                    </thead>
                    <tbody class="dark:text-gray-400">
                        {#each teamMembers as member (member.id)}
                            <tr>
                                <td>{member.name}</td>
                                <td>{teams.find(t => t.id === member.teamId)?.name ?? '-'}</td>
                                <td>
                                    <button type="button" onclick={() => openEdit(member)}>
                                        <EditSolid class="dark:text-gray-400 dark:hover:text-white"/>
                                    </button>
                                    <button type="button" onclick={() => openDelete(member)}>
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
        Update <strong>{editForm.name}</strong>
    </h3>

    <div class="flex flex-col gap-y-3">
        <label>
            Name
            <input type="text" bind:value={editForm.name} class="custom-input" />
        </label>
    
        <label>
            Team
            <select bind:value={editForm.teamId} class="custom-select">
                <option value="">No Team</option>
                {#each teams as team}
                    <option value={team.id}>{team.name}</option>
                {/each}
            </select>
        </label>
    </div>

    <div class="flex justify-center gap-2 mt-4">
        <Button onclick={updateTeamMember}>Update</Button>
        <Button color="alternative" onclick={() => (editModal = false)}>Cancel</Button>
    </div>
</Modal>

<Modal bind:open={deleteModal}>
    <p class="text-center">
        Delete <strong>{toDelete?.name}</strong>?<br />
        <span class="text-red-400">This action cannot be undone.</span>
    </p>
    <div class="flex justify-center gap-2">
        <Button onclick={() => toDelete && deleteTeamMember(toDelete.id)}>Delete</Button>
        <Button color="alternative" onclick={() => (deleteModal = false)}>Cancel</Button>
    </div>
</Modal>

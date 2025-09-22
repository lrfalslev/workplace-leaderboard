<script lang="ts">
    import { onMount } from 'svelte';
    import { Button, Modal } from 'flowbite-svelte';
    import { EditSolid, TrashBinSolid } from 'flowbite-svelte-icons';
    import { showAlert } from '$lib/stores/alert';
    import type { Team } from '$lib/types';

    export let teams: Team[] = [];
    export let onTeamsChange: (teams: Team[]) => void;

    type EditForm = {
        id: number | null;
        name: string;
    };

    let isLoading = true;

    //create
    let newTeamName = '';
    
    //update
    let editModal = false;
    let editForm: EditForm = { id: null, name: '' };

    //delete
    let deleteModal = false;
    let toDelete: Team | null = null;

    function sortTeams(list: Team[]) {
        return list.slice().sort((a, b) => a.name.localeCompare(b.name));
    }

    function openEdit(team: Team) {
        editForm = {
            id: team.id,
            name: team.name
        };
        editModal = true;
    }

    function openDelete(team: Team) {
        toDelete = team;
        deleteModal = true;
    }

    async function fetchTeams() {
        try {
            const res = await fetch('/api/teams');
            const data = await res.json();

            if (res.ok && Array.isArray(data)) {
                onTeamsChange(sortTeams(data));
            } else {
                throw new Error('Unexpected response format');
            }
        } catch (err) {
            console.error('Error fetching teams:', err);
            showAlert('Failed to load teams');
        } finally {
            isLoading = false;
        }
    }

    async function addTeam(e: SubmitEvent) {
        e.preventDefault();
        if (!newTeamName.trim()) {
            showAlert('Team name is required.');
            return;
        }
        try {
            const res = await fetch('/api/teams', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newTeamName.trim() })
            });

            if (!res.ok)
                throw new Error(await res.text());
            
            const created: Team = await res.json();
            onTeamsChange(sortTeams([...teams, created]));
            newTeamName = '';
        } catch (err) {
            console.error('Error adding team:', err);
            showAlert('Error adding team');
        }
    }

    async function updateTeam() {
        if (!editForm.id) return;

        const payload = {
            teamId: editForm.id,
            name: editForm.name.trim()
        };

        try {
            const res = await fetch('/api/teams', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error(await res.text());

            const updated: Team = await res.json();
            onTeamsChange(sortTeams(teams.map(t => t.id === updated.id ? updated : t)));
            editModal = false;
        } catch (err) {
            console.error('Error updating team:', err);
            showAlert('Error updating team');
        }
    }

    async function deleteTeam(id: number) {
        try {
            const res = await fetch(`/api/teams?id=${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error(await res.text());

            onTeamsChange(sortTeams(teams.filter(t => t.id !== id)));
            deleteModal = false;
        } catch (err) {
            console.error('Error deleting team:', err);
            showAlert('Error deleting team');
        }
    }

    onMount(fetchTeams);
</script>

<section class="m-2 p-4 bg-gray-800 rounded-lg shadow-md">
    <h2 class="text-xl font-bold mb-4 dark:text-gray-200 text-center">Teams</h2>

    <form class="flex flex-row flex-nowrap justify-center items-center gap-2 mb-4 overflow-x-auto"
        onsubmit={addTeam}>
        <input type="text" class="custom-input" placeholder="Team Name" bind:value={newTeamName} />
        <Button type="submit">Add</Button>
    </form>

    {#if isLoading}
        <div class="text-center py-8 text-gray-500 dark:text-gray-400">
            Loading teams...
        </div>
    {:else}
        <div class="max-h-full overflow-x-auto border-2 dark:border-gray-700">
            <div class="max-h-[500px] overflow-y-auto">
                <table class="admin-table text-center text-xs md:text-base dark:text-gray-800 min-w-full">
                    <thead class="text-xs uppercase">
                        <tr class="dark:text-gray-400">
                            <th>Team Name</th>
                            <th>Edit</th>
                        </tr>
                    </thead>
                    <tbody class="dark:text-gray-400">
                        {#each teams as team (team.id)}
                            <tr>
                                <td>{team.name}</td>
                                <td>
                                    <button type="button" onclick={() => openEdit(team)}>
                                        <EditSolid class="dark:text-gray-400 dark:hover:text-white"/>
                                    </button>
                                    <button type="button" onclick={() => openDelete(team)}>
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

    <label>
        Team Name
        <input type="text" bind:value={editForm.name} class="custom-input" />
    </label>

    <div class="flex justify-center gap-2 mt-4">
        <Button onclick={updateTeam}>Update</Button>
        <Button color="alternative" onclick={() => (editModal = false)}>Cancel</Button>
    </div>
</Modal>

<Modal bind:open={deleteModal}>
    <p class="text-center">
        Delete <strong>{toDelete?.name}</strong>?<br />
        <span class="text-red-400">This action cannot be undone.</span>
    </p>
    <div class="flex justify-center gap-2">
        <Button onclick={() => toDelete && deleteTeam(toDelete.id)}>Delete</Button>
        <Button color="alternative" onclick={() => (deleteModal = false)}>Cancel</Button>
    </div>
</Modal>

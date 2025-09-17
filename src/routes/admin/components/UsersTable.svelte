<script lang="ts">
    import { onMount } from 'svelte';
    import { Button, Modal } from 'flowbite-svelte';
    import { EditSolid, TrashBinSolid } from 'flowbite-svelte-icons';
    import { showAlert } from '$lib/stores/alert';
    import { type User, type Team, type TeamMember, UserRole } from '$lib/types';
    import { UserRoleLabels } from '$lib/types';

    export let users: User[] = [];
    export let teams: Team[] = [];
    export let teamMembers: TeamMember[] = [];
    export let onUsersChange: (users: User[]) => void;

    type EditForm = {
        id: number | null;
        username: string;
        role: UserRole | '';
        teamId: number | '';
        teamMemberId: number | '';
    };

    let isLoading = true;
    
    //update
    let editModal = false;
    let editForm: EditForm = { id: null, username: '', role: '', teamId: '', teamMemberId: '' };
    
    //delete
    let deleteModal = false;
    let toDelete: User | null = null;

    function sortUsers(list: User[]) {
        return list.slice().sort((a, b) => a.username.localeCompare(b.username));
    }

    function openEdit(user: User) {
          editForm = {
            id: user.id,
            username: user.username,
            role: user.role,
            teamId: user.teamId ?? '',
            teamMemberId: user.teamMemberId ?? ''
        };
        editModal = true;
    }

    function openDelete(user: User) {
        toDelete = user;
        deleteModal = true;
    }

    async function fetchUsers() {
        try {
            const res = await fetch('/api/users');
            const data = await res.json();

            if (res.ok && Array.isArray(data)) {
                onUsersChange(sortUsers(data));
                isLoading = false;
            } else {
                throw new Error('Unexpected response format');
            }
        } catch (err) {
            console.error('Error fetching users:', err);
            showAlert('Filed to load users');
        }
    }

    async function updateUser() {
        if (!editForm) 
            return;

        const payload = {
            userId: editForm.id,
            role: editForm.role,
            teamId: editForm.teamId || null,
            teamMemberId: editForm.teamMemberId || null
        };

        try {
            const res = await fetch('/api/users', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) 
                throw new Error(await res.text());

            const updated: User = await res.json();
            onUsersChange(sortUsers(users.map(user => user.id === updated.id ? updated : user)));
            editModal = false;
        } catch (err) {
            console.error('Error updating user:', err);
            showAlert('Error updating user');
        }
    }

    async function deleteUser(id: number) {
        try {
            const res = await fetch(`/api/users?id=${id}`, { method: 'DELETE' });
            if (!res.ok) 
                throw new Error(await res.text());

            onUsersChange(sortUsers(users.filter(u => u.id !== id)));
            deleteModal = false;
        } catch (err) {
            console.error('Error deleting user:', err);
            showAlert('Error deleting user');
        }
    }
    
    onMount(fetchUsers);
</script>


<section class="m-2 p-4 bg-gray-800 rounded-lg shadow-md">
    <h2 class="text-xl font-bold mb-4 dark:text-gray-200 text-center">Users</h2>
    
    {#if isLoading}
        <div class="text-center py-8 text-gray-500 dark:text-gray-400">
            Loading users...
        </div>
    {:else}
        <div class="max-h-full overflow-x-auto border-2 dark:border-gray-700">
            <div class="max-h-[500px] overflow-y-auto">
                <table class="admin-table text-center text-xs md:text-base dark:text-gray-800 min-w-full">
                    <thead class="text-xs uppercase">
                        <tr class="dark:text-gray-400">
                            <th>Username</th>
                            <th>Role</th>
                            <th>Team</th>
                            <th>Team Member</th>
                            <th>Edit</th>
                        </tr>
                    </thead>
                    <tbody class="dark:text-gray-400">
                        {#each users as user (user.id)}
                            <tr>
                                <td>{user.username}</td>
                                <td>{UserRoleLabels[user.role] ?? '-'}</td>
                                <td>{teams.find(team => team.id === user.teamId)?.name ?? '-'}</td>
                                <td>{teamMembers.find(members => members.id === user.teamMemberId)?.name ?? '-'}</td>
                                <td>
                                    <button type="button" onclick={() => openEdit(user)}>
                                        <EditSolid class="dark:text-gray-400 dark:hover:text-white"/>
                                    </button>
                                    <button type="button" onclick={() => openDelete(user)}>
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
        Update <strong>{editForm.username}</strong>
    </h3>

    <div class="flex flex-col gap-y-3">
        <label>
            Role
            <select bind:value={editForm.role} class="custom-select">
                <option value="" disabled>Assigned Role</option>
                {#each Object.values(UserRole) as userRole}
                    <option value={userRole}>{UserRoleLabels[userRole]}</option>
                {/each}
            </select>
        </label>
    
        <label>
            Linked Team Member
            <select bind:value={editForm.teamMemberId} class="custom-select">
                <option value="">No Team Member</option>
                {#each teamMembers as member}
                    <option value={member.id}>{member.name}</option>
                {/each}
            </select>
        </label>
    
        {#if editForm?.role === 'manager'}
            <label>
                Managed Team
                <select bind:value={editForm.teamId} class="custom-select">
                    <option value="">No Team</option>
                    {#each teams as team}
                        <option value={team.id}>{team.name}</option>
                    {/each}
                </select>
            </label>
        {/if}
    </div>

    <div class="flex justify-center gap-2">
        <Button onclick={() => editForm && updateUser()}>Update</Button>
        <Button color="alternative" onclick={() => (editModal = false)}>Cancel</Button>
    </div>
</Modal>

<Modal bind:open={deleteModal}>
    <p class="text-center">
        Delete <strong>{toDelete?.username}</strong>?<br />
        <span class="text-red-400">This action cannot be undone.</span>
    </p>
    <div class="flex justify-center gap-2">
        <Button onclick={() => toDelete && deleteUser(toDelete.id)}>Delete</Button>
        <Button color="alternative" onclick={() => (deleteModal = false)}>Cancel</Button>
    </div>
</Modal>

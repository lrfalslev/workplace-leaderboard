<script lang="ts">
    import { onMount } from 'svelte';
    import { Button, Modal } from 'flowbite-svelte';
    import { EditSolid, TrashBinSolid } from 'flowbite-svelte-icons';
    import { UserRole, type TeamMember, type User } from '$lib/types';
    import { showAlert } from '$lib/stores/alert';

    let users: User[] = $state([]);
    let teamMembers: TeamMember[] = $state([]);
    let editModal = $state(false);
    let deleteModal = $state(false);
    let selectedUser: User | null = $state(null);
    let selectedRole: UserRole = $state(UserRole.User);
    let selectedTeamMember: number | null = $state(null);

    const roleOptions = Object.values(UserRole);

    async function fetchUsers() {
        try {
            const response = await fetch('/api/users');
            const data = await response.json();
            if (response.ok && Array.isArray(data)) {
                users = data.sort((a, b) => a.username.localeCompare(b.username));
            } else {
                console.error('Unexpected response format: ', data);
            }
        } catch (err) {
            console.error('Failed to fetch users: ', err);
        }
    }

    async function updateUser() {
        if (!selectedUser) return;

        try {
            const response = await fetch('/api/users', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    id: selectedUser.id, 
                    role: selectedRole, 
                    teamMember: selectedTeamMember 
                })
            });

            if (!response.ok) {
                throw new Error(await response.text());
            }

            // Update local state
            const index = users.findIndex(u => u.id === selectedUser?.id);
            if (index !== -1) {
                users[index].role = selectedRole;
                users[index].teamMemberId = selectedTeamMember ?? null;
            }

            editModal = false;
            selectedUser = null;
            selectedRole = UserRole.User;
            selectedTeamMember = null;
        } catch (err) {
            console.error('Error updating user: ', err);
            showAlert('Could not update user. Please try again.');
        }
    }

    async function deleteUser(id: number) {
        try {
            const response = await fetch(`/api/users?id=${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error(await response.text());
            }

            users = users.filter(user => user.id !== id);
            deleteModal = false;
            selectedUser = null;
        } catch (err) {
            console.error('Error deleting user: ', err);
            showAlert('Could not delete user. Please try again.');
        }
    }
    
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

    function openEditModal(user: User) {
        selectedUser = user;
        selectedRole = user.role;
        selectedTeamMember = user.teamMemberId;
        editModal = true;
    }

    function openDeleteModal(user: User) {
        selectedUser = user;
        deleteModal = true;
    }

    onMount(() => {
        fetchUsers();
        fetchTeamMembers();
    });
</script>

<div class="flex justify-center md:w-[60%] max-w-screen-l max-h-[80vh] overflow-x-auto overflow-y-auto">
  <table class="w-auto md:w-full text-center text-xs md:text-base dark:text-gray-400 min-w-full">
    <thead class="text-xs uppercase">
      <tr class="dark:bg-gray-600">
        <th class="px-6 py-3">Username</th>
        <th class="px-6 py-3">Role</th>
        <th class="px-6 py-3">Team Member</th>
        <th class="px-6 py-3">Edit</th>
      </tr>
    </thead>
    <tbody>
      {#each users as user}
        {@const teamMemberName = teamMembers.find(c => c.id === user.teamMemberId)?.name ?? '-'}
        <tr class="bg-white dark:bg-gray-800 dark:border-gray-700 border-b last:border-b-0">
          <td class="max-w-[100px] sm:max-w-none overflow-hidden text-ellipsis whitespace-nowrap" 
              title={user.username.length > 15 ? user.username : undefined}>
              {user.username}
          </td>
          <td>{user.role}</td>
            <td class="max-w-[100px] sm:max-w-none overflow-hidden text-ellipsis whitespace-nowrap"
                title={teamMemberName.length > 15 ? teamMemberName : undefined}>
                {teamMemberName}
            </td>
          <td>
            <div class="inline-flex justify-center gap-2">
                <Button class="w-6 h-6 sm:w-auto sm:h-auto" size="xs" onclick={() => openEditModal(user)}>
                    <EditSolid class="w-4 h-4" />
                </Button>
                <Button class="w-6 h-6 sm:w-auto sm:h-auto" size="xs" onclick={() => openDeleteModal(user)}>
                    <TrashBinSolid class="w-4 h-4" />
                </Button>
            </div>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<Modal bind:open={editModal} size="xs" class="pt-8 text-center">
    <h3 class="text-lg font-semibold mb-4">Update <strong>{selectedUser?.username}</strong></h3>
    <select bind:value={selectedRole} class="custom-select">
        <option value="" disabled selected>Assigned Role</option>
        {#each roleOptions as role}
            <option value={role}>{role}</option>
        {/each}
    </select>    
    <select bind:value={selectedTeamMember} class="custom-select">
        <option value="" disabled selected>Linked team member</option>

        {#each teamMembers as teamMember}
            <option value={teamMember.id}>{teamMember.name}</option>
        {/each}
    </select>
    <div class="flex justify-center gap-2">
        <Button onclick={updateUser}>Update</Button>
        <Button color="alternative" onclick={() => (editModal = false)}>Cancel</Button>
    </div>
</Modal>

<Modal bind:open={deleteModal} size="xs" class="pt-8 text-center">
    <p>
        Delete <strong>{selectedUser?.username}</strong>?<br />
        <span class="text-red-400">This action cannot be undone.</span>
    </p>
    <div class="flex justify-center gap-2">
        <Button onclick={() => selectedUser && deleteUser(selectedUser.id)}>Delete</Button>
        <Button color="alternative" onclick={() => (deleteModal = false)}>Cancel</Button>
    </div>
</Modal>

<style>
    table {
  width: 100%;
  overflow-x: auto;
  display: block;
}

/* For larger screens (desktop) */
@media (min-width: 768px) {
  table {
    width: 80%;
    margin: 0 auto; /* centers the table */
    display: table; /* restores normal table layout */
    overflow-x: visible;
  }
}

  th,
  td {
    padding: 0.5rem;
    white-space: nowrap;
  }

  th {  
    background-color: #4B5563; /* Tailwind's bg-gray-700 */
    position: sticky;
    top: 0;
    z-index: 10;
  }
  
  .custom-select {
    display: block;
    width: 100%;
    color: #111827; /* gray-900 */
    background-color: #f9fafb; /* gray-50 */
    border: 1px solid #d1d5db; /* gray-300 */
    border-radius: 0.5rem; /* rounded-lg */
    font-size: 0.875rem; /* text-sm */
    padding: 0.625rem 0.625rem; /* px-2.5 py-2.5 */
    outline: none;
  }

  .custom-select:focus {
    --ring-color: #3b82f6; /* primary-500 */
    box-shadow: 0 0 0 2px var(--ring-color);
    border-color: var(--ring-color);
  }

  /* Dark mode styles */
  @media (prefers-color-scheme: dark) {
    .custom-select {
      background-color: #374151; /* gray-700 */
      border-color: #4b5563; /* gray-600 */
      color: #fff; /* white */
    }
    .custom-select:focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 2px #3b82f6;
    }
  }

  /* Placeholder style */
  .custom-select option[disabled] {
    color: #9ca3af; /* gray-400 */
  }
</style>
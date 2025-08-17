<script lang="ts">
    import { onMount } from 'svelte';
    import { Table, TableBody, TableHead, TableHeadCell, TableBodyRow, TableBodyCell, Button, Modal, Select } from 'flowbite-svelte';
    import { EditSolid, TrashBinSolid } from 'flowbite-svelte-icons';
    import { UserRole, type User } from '$lib/types';

    let users: User[] = $state([]);
    let editModal = $state(false);
    let deleteModal = $state(false);
    let selectedUser: User | null = null;
    let selectedRole: UserRole = UserRole.User;

    const roleOptions = Object.values(UserRole);

    async function fetchUsers() {
        try {
            const response = await fetch('/api/users');
            const data = await response.json();
            if (response.ok && Array.isArray(data)) {
                users = data;
            } else {
                console.error('Unexpected response format:', data);
            }
        } catch (err) {
            console.error('Failed to fetch users:', err);
        }
    }

    async function updateUserRole() {
        if (!selectedUser) return;

        try {
            const response = await fetch('/api/users', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: selectedUser.id, role: selectedRole })
            });

            if (!response.ok) {
                alert('❌ Could not update user role.');
                return;
            }

            // Update local state
            const index = users.findIndex(u => u.id === selectedUser?.id);
            if (index !== -1) {
                users[index].role = selectedRole;
            }

            editModal = false;
            selectedUser = null;
        } catch (err) {
            console.error('Error updating user role:', err);
            alert('❌ Could not update user role.');
        }
    }

    async function deleteUser(id: number) {
        try {
            const response = await fetch(`/api/users?id=${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                alert('❌ Could not delete user. Please try again.');
            }

            users = users.filter(user => user.id !== id);
            deleteModal = false;
            selectedUser = null;
        } catch (err) {
            console.error('Error deleting user.', err);
            alert('❌ Could not delete project user. Please try again.');
        }
    }

    function openEditModal(user: User) {
        selectedUser = user;
        selectedRole = user.role;
        editModal = true;
    }

    function openDeleteModal(user: User) {
        selectedUser = user;
        deleteModal = true;
    }

    onMount(() => {
        fetchUsers();
    });
</script>


<div class="max-w-4xl mx-auto mt-6">
    <Table>
        <TableHead>
            <TableHeadCell>Username</TableHeadCell>
            <TableHeadCell>Role</TableHeadCell>
            <TableHeadCell class="sr-only">Edit</TableHeadCell>
        </TableHead>
        <TableBody>
            {#each users as user}
                <TableBodyRow>
                    <TableBodyCell>{user.username}</TableBodyCell>
                    <TableBodyCell>{user.role}</TableBodyCell>
                    <TableBodyCell>
                        <Button size="xs" onclick={() => openEditModal(user)}>
                            <EditSolid class="w-4 h-4" />
                        </Button>
                        <Button size="xs" onclick={() => openDeleteModal(user)}>
                            <TrashBinSolid class="w-4 h-4" />
                        </Button>
                    </TableBodyCell>
                </TableBodyRow>
            {/each}
        </TableBody>
    </Table>
</div>

<Modal bind:open={editModal} size="xs" class="pt-8 text-center">
    <h3 class="text-lg font-semibold mb-4">Edit Role for {selectedUser?.username}</h3>
    <Select bind:value={selectedRole} class="mb-4">
        {#each roleOptions as role}
            <option value={role}>{role}</option>
        {/each}
    </Select>
    <div class="flex justify-center gap-2">
        <Button onclick={updateUserRole}>Update</Button>
        <Button color="alternative" onclick={() => (editModal = false)}>Cancel</Button>
    </div>
</Modal>

<Modal bind:open={deleteModal} size="xs" class="pt-8 text-center">
    <h3 class="text-lg font-semibold mb-4">Delete {selectedUser?.username}</h3>
    <div class="flex justify-center gap-2">
        <Button onclick={() => selectedUser && deleteUser(selectedUser.id)}>Delete</Button>
        <Button color="alternative" onclick={() => (deleteModal = false)}>Cancel</Button>
    </div>
</Modal>
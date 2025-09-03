<script lang="ts">
    import { showAlert } from "$lib/stores/alert";
    import { user } from "$lib/stores/user";
    import type { BonusTicket, TeamMember } from "$lib/types";
    import { Button, Card, Input, Modal, Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell } from "flowbite-svelte";
    import { CirclePlusSolid, EditSolid, TrashBinSolid } from "flowbite-svelte-icons";
    import { onMount } from "svelte";

    const { teamMembers } = $props<{
        teamMembers: TeamMember[];
    }>();

    let tickets = $state<BonusTicket[]>([]);
    
    // creating fields
    let newDate = $state(new Date().toLocaleDateString('en-CA'));
    let teamMemberId = $state<number>();
    let description = $state('');
    let ticketsAwarded = $state('');

    // editing fields
    let editingId = $state<number | null>(null);
    let formInputs = $state<Record<number, BonusTicket>>({});

    // deleting fields
    let deleteRowModal = $state(false);
    let deleteTicket = $state<BonusTicket | null>(null);

    async function fetchBonusTickets() {
        try {
            const response = await fetch('/api/tickets');

            if (!response.ok) 
                throw new Error(`HTTP ${response.status}`);

            const data = await response.json();
            if (!Array.isArray(data))
                throw new Error('Invalid data format');

            tickets = sortTickets(data);
        } catch (err) {
            console.error('Failed to fetch bonus tickets: ', err);
            showAlert('Could not load bonus tickets.');
        }
    }

    function startEditing(ticket: BonusTicket) {
        editingId = ticket.id;
        formInputs[ticket.id] = { ...ticket };
    }

    async function handleAdd() {
        const error = validateAddForm();
        if (error) {
            showAlert(error);
            return;
        }

        try {
            const payload = {
                date: newDate,
                description,
                ticketsAwarded: Number(ticketsAwarded),
                teamMemberId: teamMemberId,
                managerId: $user?.id
            };

            const newTicket = await request<BonusTicket>('/api/tickets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            tickets = sortTickets([...tickets, newTicket]);
            
            teamMemberId = undefined;
            description = '';
            ticketsAwarded = '';
        } catch (err) {
            console.error('Add failed:', err);
            showAlert('Could not add bonus ticket.');
        }
    }

    function validateAddForm(): string | undefined {
        if (!teamMemberId)
            return 'Please select a team member.'

        if (description.trim() === '')
            return 'Description is required.';

        const ticketsNum = Number(ticketsAwarded);
        if (isNaN(ticketsNum) || ticketsNum <= 0) 
            return 'Tickets must be a positive number.';
    }

    async function handleSave(id: number) {
        const error = validateForm(id);
        if (error) {
            showAlert(error);
            return;
        }

        try {
            const updatedTicket = await request<BonusTicket>('/api/tickets', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formInputs[id])
            });

            tickets = sortTickets(
                tickets.map(ticket =>
                    ticket.id === updatedTicket.id ? updatedTicket : ticket
                )
            );

            editingId = null;
        } catch (err) {
            console.error('Save failed:', err);
            showAlert('Could not save changes.');
        }
    }
    
    function validateForm(id: number): string | undefined {
        const { description, ticketsAwarded } = formInputs[id];
        const ticketsNum = Number(ticketsAwarded);

        if (description.trim() == '')
            return 'Description is required.';

        if (isNaN(ticketsNum) || ticketsNum <= 0)
            return 'Tickets must be a positive number.';
    }

    async function handleDelete(id: number) {
        try {
            await request('/api/tickets?id=' + id, { method: 'DELETE' });
            tickets = tickets.filter(ticket => ticket.id !== id);
        } catch (err) {
            console.error('Delete failed:', err);
            showAlert('Could not delete ticket.');
        }
    }

    async function request<T>(url: string, options: RequestInit): Promise<T> {
        const response = await fetch(url, options);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
    }

    function sortTickets(tickets: BonusTicket[]): BonusTicket[] {
        return [...tickets].sort((a, b) => b.date.localeCompare(a.date));
    }

    onMount(() => {
        fetchBonusTickets();
    });
</script>

<div class="flex items-left sticky top-0 z-30 justify-end">
    <div class="flex gap-2 mb-4 mr-12">
        <Input bind:value={newDate} type="date" class="flex-1" onkeydown={(e) => e.key === 'Enter' && handleAdd()}/>

        <select bind:value={teamMemberId} class="custom-select" onkeydown={(e) => e.key === 'Enter' && handleAdd()}>
            <option value="" disabled selected>Team Member</option>
            {#each teamMembers as teamMember}
                <option value={teamMember.id}>{teamMember.name}</option>
            {/each}
        </select>
        <Input type="text" class="custom-input" placeholder="Reason" bind:value={description} onkeydown={(e) => e.key === 'Enter' && handleAdd()} />
        <Input type="number" placeholder="Tickets" bind:value={ticketsAwarded} onkeydown={(e) => e.key === 'Enter' && handleAdd()} />
        <Button onclick={() => handleAdd()}>
            <CirclePlusSolid class="dark:text-white"/>
        </Button>
    </div>
</div>
<div class="max-h-[75vh] overflow-y-auto w-[80vw] max-w-full table-fixed mx-auto border-2 dark:border-gray-700">
    <Card class="max-w-[100%] border-none">
        <Table class="text-center w-full table-fixed p-0">
            <TableHead>
                <TableHeadCell>Date</TableHeadCell>
                <TableHeadCell>Name</TableHeadCell>
                <TableHeadCell>Description</TableHeadCell>
                <TableHeadCell>Tickets</TableHeadCell>
                <TableHeadCell>Awarded By</TableHeadCell>
                <TableHeadCell> 
                    <span class="sr-only">Edit</span> 
                </TableHeadCell>
            </TableHead>
            <TableBody>
                {#each tickets as ticket}
                    <TableBodyRow class="items-center">
                            {#if editingId === ticket.id}
                                <TableBodyCell class="border dark:border-gray-700">
                                    <Input bind:value={formInputs[ticket.id].date} type="date" onkeydown={(e) => e.key === 'Enter' && handleSave(ticket.id)} />
                                </TableBodyCell>
                                <TableBodyCell class="border dark:border-gray-700">
                                    <select bind:value={formInputs[ticket.id].teamMemberId} class="custom-select">
                                        <option value="" disabled>Team Member</option>
                                        {#each teamMembers as teamMember}
                                            <option value={teamMember.id}>{teamMember.name}</option>
                                        {/each}
                                    </select>
                                </TableBodyCell>
                                <TableBodyCell class="border dark:border-gray-700">
                                    <Input bind:value={formInputs[ticket.id].description} type="text" onkeydown={(e) => e.key === 'Enter' && handleSave(ticket.id)} />
                                </TableBodyCell>
                                <TableBodyCell class="border dark:border-gray-700">
                                    <Input bind:value={formInputs[ticket.id].ticketsAwarded} type="number" onkeydown={(e) => e.key === 'Enter' && handleSave(ticket.id)} />
                                </TableBodyCell>
                                <TableBodyCell class="border dark:border-gray-700">{$user?.username}</TableBodyCell>
                                <TableBodyCell class="border dark:border-gray-700">
                                    <Button size="xs" onclick={() => handleSave(ticket.id)}>Save</Button>
                                    <Button size="xs" onclick={() => editingId = null}>Cancel</Button>
                                </TableBodyCell>
                            {:else}
                                <TableBodyCell class="border dark:border-gray-700">{ticket.date}</TableBodyCell>
                                <TableBodyCell class="border dark:border-gray-700">{ticket.teamMemberName}</TableBodyCell>
                                <TableBodyCell class="border dark:border-gray-700">{ticket.description}</TableBodyCell>
                                <TableBodyCell class="border dark:border-gray-700">{ticket.ticketsAwarded}</TableBodyCell>
                                <TableBodyCell class="border dark:border-gray-700">{ticket.managerName}</TableBodyCell>
                                <TableBodyCell class="border dark:border-gray-700">
                                    <div>
                                        <button type="button" onclick={() => startEditing(ticket)}>
                                            <EditSolid class="dark:text-gray-400 dark:hover:text-white"/>
                                        </button>
                                        <button type="button" onclick={() => {
                                            deleteTicket = ticket;
                                            deleteRowModal = true;
                                        }}>
                                            <TrashBinSolid class="dark:text-gray-400 dark:hover:text-white"/>
                                        </button>
                                    </div>
                                </TableBodyCell>
                            {/if}
                    </TableBodyRow>
                {/each} 
            </TableBody>
        </Table>
    </Card>
</div>
<Modal form bind:open={deleteRowModal} size="xs" class="pt-8 text-center" onaction={async ({ action }) => {
        if (action === 'success' && deleteTicket !== null) {
            await handleDelete(deleteTicket.id);
            deleteRowModal = false;
        } else if (action === 'decline') {
            deleteRowModal = false;
        }
    }}>
    <p>
        Delete {deleteTicket?.teamMemberName}'s "{deleteTicket?.description}" ticket 
        from <strong>{deleteTicket?.date}</strong>?<br />
        <span class="text-red-400">This action cannot be undone.</span>
    </p>
    <Button class="mr-2" type="submit" value="success">Delete</Button>
    <Button type="submit" value="decline" color="alternative">Cancel</Button>
</Modal>
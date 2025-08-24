<script lang="ts">
    import { Button, Modal } from 'flowbite-svelte';
    import { EditSolid, TrashBinSolid } from 'flowbite-svelte-icons';
    import { UserRole } from '$lib/types';
    import { showAlert } from '$lib/stores/alert';
    import { CirclePlusSolid } from "flowbite-svelte-icons";

    const roleOptions = Object.values(UserRole);
    
    type RelatedItem = {
        id: number;
        name: string;
    };

    let { columns, data, resource, teams = [] as RelatedItem[], teamMembers = [] as RelatedItem[] } = $props<{ 
        columns: string[];
        data: any[];
        resource: string;
        teams?: RelatedItem[];
        teamMembers?: RelatedItem[];
    }>();

    let deleteModal = $state(false);
    let editModal = $state(false);

    let selected: any = $state(null);
    let selectedRole: string = $state('');
    let selectedTeam: number | null = $state(null);
    let selectedTeamMember: number | null = $state(null);
    let selectedName: string = $state('');
    
    //adding
    let selectedTeamName: string = $state('');
    let selectedTeamMemberName: string = $state('');
    let selectedTeamMemberTeam: number | null = $state(null);
    
    function openEdit(row: any) {
        selected = row;
        selectedName = row.name ?? row.username ?? '';
        selectedRole = row.role ?? '';
        selectedTeam = row.team_id ?? null;
        selectedTeamMember = row.team_member_id ?? null;
        editModal = true;
    }
    function openDelete(row: any) { selected = row; deleteModal = true; }

    async function updateItem() {
        let payload: any;
        
        switch (resource) {
            case 'teams':
                payload = { 
                    teamId: selected.id, 
                    name: selectedName.trim()
                }
                break;
            case 'team-members':
                payload = { 
                    teamMemberId: selected.id, 
                    name: selectedName.trim(), 
                    teamId: selected.team_id ?? null 
                };
                break;
            case 'users':
                payload = { 
                    id: selected.id, 
                    role: selectedRole, 
                    teamId: selected.team_id ?? null, 
                    teamMemberId: selectedTeamMember ?? null 
                };
                break;
            default:
                return;
        }

        try {
            const res = await fetch(`/api/${resource}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) 
                throw new Error(await res.text());

            editModal = false;
            selected = null;
        } catch (err) {
            showAlert(`Error updating ${resource}`);
        }
    }

    async function deleteItem(id: any) {
        try {
            const res = await fetch(`/api/${resource}?id=${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error(await res.text());
            deleteModal = false;
        } catch (err) {
            showAlert(`Error deleting ${resource}`);
        }
    }

    async function addItem() {
        let payload: any;
        
        switch (resource) {
            case 'teams':
                payload = { 
                    name: selectedTeamName.trim()
                }
                break;
            case 'team-members':
                payload = { 
                    name: selectedTeamMemberName.trim(), 
                    teamId: selectedTeamMemberTeam
                };
                break;
            default:
                return;
        }
        try {
            const res = await fetch(`/api/${resource}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) 
                throw new Error(await res.text());

            selectedTeamName = "";
            selectedTeamMemberName = "";
        } catch (err) {
            showAlert(`Error adding ${resource}`);
        }
    }
</script>

{#if resource === 'teams' || resource === 'team-members'}
  <div class="flex flex-wrap items-center gap-2 mb-4">
    {#if resource === 'teams'}
        <input
        type="text"
        class="custom-input"
        placeholder="Team name"
        bind:value={selectedTeamName}
        />
    {:else}
        <select
        class="custom-select"
        bind:value={selectedTeamMemberTeam}
        >
        <option value="" disabled selected>Select team</option>
        {#each teams as team}
            <option value={team.id}>{team.name}</option>
        {/each}
        </select>
    
        <input
            type="text"
            class="custom-input"
            placeholder="Member name"
            bind:value={selectedTeamMemberName}
        />
    {/if}

    <Button onclick={addItem}>
        <CirclePlusSolid class="dark:text-gray-400 dark:hover:text-white"/>
    </Button>
  </div>
{/if}


<div class="flex justify-center md:w-[60%] max-w-screen-l max-h-[80vh] overflow-x-auto overflow-y-auto">
  <table class="w-auto md:w-full text-center text-xs md:text-base dark:text-gray-400 min-w-full">
    <thead class="text-xs uppercase">
      <tr class="dark:bg-gray-600">
        {#each columns as col}
            <th>{col}</th>
        {/each}
      </tr>
    </thead>
    <tbody>
        {#each data as row}
        <tr>
            <td>{row.id}</td>
            <td>{row.username || row.name}</td>
            {#if row.role}
                <td>{row.role}</td>
            {/if}
            {#if row.team_id}
                {#if teams.length}
                    <td>{teams.find((r: RelatedItem) => r.id === row.team_id)?.name ?? '-'}</td>
                {/if}
            {/if}
            {#if row.team_member_id}
                {#if teamMembers.length}
                    <td>{teamMembers.find((r: RelatedItem) => r.id === row.team_member_id)?.name ?? '-'}</td>
                {/if}
            {/if}
            <td>
                <Button onclick={() => openEdit(row)}><EditSolid /></Button>
                <Button onclick={() => openDelete(row)}><TrashBinSolid /></Button>
            </td>
        </tr>
        {/each}
    </tbody>
  </table>
</div>

<Modal bind:open={editModal} size="xs" class="pt-8 text-center">
    <h3 class="text-lg font-semibold mb-4">
        Update <strong>{selected?.username ?? selected?.name}</strong>
    </h3>
    {#if resource === 'users'}
        <select bind:value={selectedRole} class="custom-select">
        <option value="" disabled>Assigned Role</option>
        {#each roleOptions as role}
            <option value={role}>{role}</option>
        {/each}
        </select>

        <select bind:value={selectedTeamMember} class="custom-select">
        <option value="" disabled>Linked Team Member</option>
        {#each teamMembers as member}
            <option value={member.id}>{member.name}</option>
        {/each}
        </select>

        {#if selectedRole === 'manager'}
            <select bind:value={selectedTeam} class="custom-select">
                <option value="" disabled>Managed Team</option>
                {#each teams as team}
                    <option value={team.id}>{team.name}</option>
                {/each}
            </select>
        {/if}
    {:else if resource === 'team-members'}
        <input type="text" bind:value={selectedName} placeholder="Name" class="custom-input" />

        <select bind:value={selectedTeam} class="custom-select">
        <option value="" disabled>Managed Team</option>
        {#each teams as team}
            <option value={team.id}>{team.name}</option>
        {/each}
        </select>
    {:else if resource === 'teams' }
        <input type="text" bind:value={selectedName} placeholder="Name" class="custom-input" />
    {/if}
    <div class="flex justify-center gap-2">
        <Button onclick={() => selected && updateItem()}>Update</Button>
        <Button color="alternative" onclick={() => (editModal = false)}>Cancel</Button>
    </div>
</Modal>

<Modal bind:open={deleteModal} size="xs" class="pt-8 text-center">
    <p>
        Delete <strong>{selected?.username?? selected?.name}</strong>?<br />
        <span class="text-red-400">This action cannot be undone.</span>
    </p>
    <div class="flex justify-center gap-2">
        <Button onclick={() => selected && deleteItem(selected.id)}>Delete</Button>
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
    .custom-input {
    display: block;
    width: 100%;
    background-color: #374151; /* gray-700 */
    color: #ffffff;
    border-color: #4b5563; /* gray-600 */
    border-radius: 0.5rem; /* rounded-lg */
    font-size: 0.875rem; /* text-sm */
    padding: 0.625rem 0.625rem; /* px-2.5 py-2.5 */
    outline: none;

    /* States */
    cursor: text;
  }

  .custom-input:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  .custom-input:focus {
      border-color: #ef562f;
      box-shadow: 0 0 0 1px #ef562f;
  }

  .custom-input::placeholder {
      color: #9ca3af; /* gray-400 */
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
    --ring-color: #ef562f; /* primary-500 */
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
      border-color: #ef562f;
      box-shadow: 0 0 0 2px #ef562f;
    }
  }

  /* Placeholder style */
  .custom-select option[disabled] {
    color: #9ca3af; /* gray-400 */
  }
</style>
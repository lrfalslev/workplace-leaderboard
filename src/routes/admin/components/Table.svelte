<script lang="ts">
    import { Button, Modal } from 'flowbite-svelte';
    import { EditSolid, TrashBinSolid } from 'flowbite-svelte-icons';
    import { UserRoleLabels, TeamTypeLabels, UserRole, TeamType } from '$lib/types';
    import { showAlert } from '$lib/stores/alert';
    import { CirclePlusSolid } from "flowbite-svelte-icons";
        
    type RelatedItem = {
        id: number;
        name: string;
    };

    let { 
        columns,
        data,
        resource,
        teams = [] as RelatedItem[],
        teamMembers = [] as RelatedItem[],
        onAdd,
        onDelete,
        onUpdate
    } = $props<{ 
        columns: string[];
        data: any[];
        resource: string;
        teams?: RelatedItem[];
        teamMembers?: RelatedItem[];
        onAdd: (resource: string, newItem: any) => void;
        onDelete: (resource: string, id: number) => void;
        onUpdate: (resource: string, updatedItem: any) => void;
    }>();

    let deleteModal = $state(false);
    let editModal = $state(false);

    let selected: any = $state(null);
    let selectedRole: string = $state('');
    let selectedType: string = $state('');
    let selectedTeam: number | null = $state(null);
    let selectedTeamMember: number | null = $state(null);
    let selectedName: string = $state('');
    
    //creation fields
    let selectedTeamName: string = $state('');
    let selectedTeamType: TeamType = $state(TeamType.TICKET_ONLY);
    let selectedTeamMemberName: string = $state('');
    let selectedTeamMemberTeam: string = $state('');
    
    function openEdit(row: any) {
        selected = row;
        selectedName = row.name ?? row.username ?? '';
        selectedRole = row.role ?? '';
        selectedType = row.type ?? '';
        selectedTeam = row.team_id ?? null;
        selectedTeamMember = row.team_member_id ?? null;
        editModal = true;
    }
    function openDelete(row: any) { selected = row; deleteModal = true; }

    async function addItem() {
        let payload: any;
        
        switch (resource) {
            case 'teams':
                if (!selectedTeamName.trim()) {
                    showAlert('Team name is required.');
                    return;
                }
                payload = { 
                    name: selectedTeamName.trim(),
                    type: selectedTeamType
                }
                break;
            case 'team-members':
                if (!selectedTeamMemberName.trim()) {
                    showAlert('Team Member name is required.');
                    return;
                }
                const teamId = Number(selectedTeamMemberTeam);
                if (!teamId) {
                    showAlert('Team is required.');
                    return;
                }
                payload = { 
                    name: selectedTeamMemberName.trim(), 
                    teamId: teamId
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

            const newItem = await res.json();
            onAdd(resource, newItem);
            resetSelection();

        } catch (err) {
            console.error(`Error adding ${resource}: `, err);
            showAlert(`Error adding ${resource}`);
        }
    }
    
    function resetSelection() {
        if (resource === 'teams') {
            selectedTeamName = '';
        } else if (resource === 'team-members') {
            selectedTeamMemberName = '';
        }
    }

    async function deleteItem(id: any) {
        try {
            const res = await fetch(`/api/${resource}?id=${id}`, { method: 'DELETE' });
            if (!res.ok) 
                throw new Error(await res.text());
            
            deleteModal = false;
            onDelete(resource, id);
            resetSelection();
        } catch (err) {
            showAlert(`Error deleting ${resource}`);
        }
    }

    async function updateItem() {
        let payload: any;
        
        switch (resource) {
            case 'teams':
                payload = { 
                    teamId: selected.id, 
                    name: selectedName.trim(),
                    type: selectedType
                }
                break;
            case 'team-members':
                payload = { 
                    teamMemberId: selected.id, 
                    name: selectedName.trim(), 
                    teamId: selected.teamId ?? null 
                };
                break;
            case 'users':
                payload = { 
                    userId: selected.id, 
                    role: selectedRole, 
                    teamId: selected.teamId ?? null, 
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

            const updatedItem = await res.json();
            onUpdate(resource, updatedItem);
            editModal = false;
            selected = null;
        } catch (err) {
            showAlert(`Error updating ${resource}`);
        }
    }
</script>

{#if resource === 'teams' || resource === 'team-members'}
    <form class="flex flex-row flex-nowrap justify-center items-center gap-2 mb-4 overflow-x-auto"
        onsubmit={addItem}>
        {#if resource === 'teams'}
            <input type="text" class="custom-input" placeholder="Team Name" bind:value={selectedTeamName} />
            
            <select bind:value={selectedTeamType} class="custom-select">
            <option value="" disabled>Team Type</option>
            {#each Object.values(TeamType) as teamType}
                <option value={teamType}>{TeamTypeLabels[teamType]}</option>
            {/each}
            </select>
        {:else}
            <select bind:value={selectedTeamMemberTeam} class="custom-select">
            <option value="" disabled selected>Team</option>
            {#each teams as team}
                <option value={team.id}>{team.name}</option>
            {/each}
            </select>
        
            <input type="text" class="custom-input" placeholder="Member Name" bind:value={selectedTeamMemberName} />
        {/if}

        <Button onclick={addItem}>
            <CirclePlusSolid class="dark:text-gray-400 dark:hover:text-white"/>
        </Button>
    </form>
{/if}

<div class="max-h-full overflow-x-auto">
    <div class="max-h-[500px] overflow-y-auto">
        <table class="w-auto md:w-full text-center text-xs md:text-base dark:text-gray-800 min-w-full dark:bg-gray-500">
          <thead class="text-xs uppercase">
            <tr class="dark:bg-gray-600 dark:text-gray-900">
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
                  {#if resource === 'users'}
                      <td>{UserRoleLabels[row.role as keyof typeof UserRoleLabels] ?? '-'}</td>
                  {/if}
                  {#if (resource === 'users' || resource === 'team-members')}
                      <td>{teams.find((team: RelatedItem) => team.id === row.teamId)?.name ?? '-'}</td>
                  {/if}            
                  {#if (resource === 'users')}
                      <td>{teamMembers.find((teamMember: RelatedItem) => teamMember.id === row.team_member_id)?.name ?? '-'}</td>
                  {/if}        
                  {#if (resource === 'teams')}
                      <td>{TeamTypeLabels[row.type as keyof typeof TeamTypeLabels] ?? '-'}</td>
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
</div>

<Modal bind:open={editModal} size="xs" class="pt-8 text-center">
    <h3 class="text-lg font-semibold mb-4">
        Update <strong>{selected?.username ?? selected?.name}</strong>
    </h3>
    {#if resource === 'users'}
        <select bind:value={selectedRole} class="custom-select">
        <option value="" disabled>Assigned Role</option>
        {#each Object.values(UserRole) as userRole}
            <option value={userRole}>{UserRoleLabels[userRole]}</option>
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
    {:else if resource === 'teams' }
        <input type="text" bind:value={selectedName} placeholder="Name" class="custom-input" />
        
        <select bind:value={selectedType} class="custom-select">
        <option value="" disabled>Team Type</option>
        {#each Object.values(TeamType) as teamType}
            <option value={teamType}>{TeamTypeLabels[teamType]}</option>
        {/each}
        </select>
    {:else if resource === 'team-members'}
        <input type="text" bind:value={selectedName} placeholder="Name" class="custom-input" />

        <select bind:value={selectedTeam} class="custom-select">
        <option value="" disabled>Managed Team</option>
        {#each teams as team}
            <option value={team.id}>{team.name}</option>
        {/each}
        </select>
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
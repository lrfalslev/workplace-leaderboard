<script lang="ts">
    import { onMount } from 'svelte';
    import Table from './components/Table.svelte';
    import type { Team, TeamMember, User, Metric } from '$lib/types';

    let teams: Team[] = $state([]);
    let teamMembers: TeamMember[] = $state([]);
    let users: User[] = $state([]);
    let metrics: Metric[] = $state([]);

    let isLoading = $state(true);

    // column definitions
    const teamColumns = ['Team Name', 'Edit'];
    const teamMemberColumns = ['Name', 'Team', 'Edit'];
    const userColumns = ['Username', 'Role', 'Team', 'Team Member', 'Edit'];
    const metricColumns = ['Team', 'Type', 'Qualified Work Items', 'Total Work Items', 'Edit'];

    async function fetchTeams() {
        try {
            const response = await fetch('/api/teams');
            const data = await response.json();

            if (response.ok && Array.isArray(data)) {
                teams = sortTeams(data);
            } else {
                console.error('Unexpected response format: ', data);
            }
        } catch (err) {
            console.error('Failed to fetch topviews: ', err);
        }
    }

    async function fetchTeamMembers() {
        try {
            const response = await fetch('/api/team-members');
            const data = await response.json();

            if (response.ok && Array.isArray(data)) {
                teamMembers = sortTeamMembers(data);
            } else {
                console.error('Unexpected response format: ', data);
            }
        } catch (err) {
            console.error('Failed to fetch topviews: ', err);
        }
    }

    async function fetchUsers() {
        try {
            const response = await fetch('/api/users');
            const data = await response.json();

            if (response.ok && Array.isArray(data)) {
                users = sortUsers(data);
            } else {
                console.error('Unexpected response format: ', data);
            }
        } catch (err) {
            console.error('Failed to fetch users: ', err);
        }
    }

    async function fetchmetrics() {
      try {
          const response = await fetch('/api/metrics');
          const data = await response.json();
          console.log('Fetched metrics: ', data);

          if (response.ok && Array.isArray(data)) {
              metrics = data;
          } else {
              console.error('Unexpected response format: ', data);
          }
      } catch (err) {
          console.error('Failed to fetch metrics: ', err);
      }
    }

    function handleAdd(resource: string, newItem: any) {
      if (resource === 'teams') {
        teams = sortTeams([...teams, newItem]);
      } else if (resource === 'team-members') {
        teamMembers = sortTeamMembers([...teamMembers, newItem]);
      } else if (resource === 'metrics') {
        metrics = [...metrics, newItem];
      }
    }

    function handleDelete(resource: string, id: number) {
      if (resource === 'teams') {
        teams = sortTeams(teams.filter(team => team.id !== id));
      } else if (resource === 'team-members') {
        teamMembers = sortTeamMembers(teamMembers.filter(member => member.id !== id));
      } else if (resource === 'users') {
        users = sortUsers(users.filter(user => user.id !== id));
      } else if (resource === 'metrics') {
        metrics = metrics.filter(item => item.id !== id);
      }
    }
    
    function handleUpdate(resource: string, updatedItem: any) {
      if (resource === 'teams') {
        teams = sortTeams(teams.map(team =>
          team.id === updatedItem.id ? updatedItem : team
        ));
      } else if (resource === 'team-members') {
        teamMembers = sortTeamMembers(teamMembers.map(member =>
          member.id === updatedItem.id ? updatedItem : member
        ));
      } else if (resource === 'users') {
        users = sortUsers(users.map(user =>
          user.id === updatedItem.id ? updatedItem : user
        ));
      } else if (resource === 'metrics') {
        metrics = metrics.map(item =>
            item.id === updatedItem.id ? updatedItem : item
        );
      }
    }
    
    function sortTeams(list: Team[]): Team[] {
      return list.slice().sort();
    }

    function sortTeamMembers(list: TeamMember[]): TeamMember[] {
      return list.slice().sort((a, b) => {
        if (a.teamId !== b.teamId) {
          return a.teamId - b.teamId;
        }
        return a.name.localeCompare(b.name);
      });
    }

    function sortUsers(list: User[]): User[] {
      return list.slice().sort((a, b) => a.username.localeCompare(b.username));
    }

    onMount(async () => {
        try {
            await Promise.all([
                fetchTeams(),
                fetchTeamMembers(),
                fetchUsers(),
                fetchmetrics()
            ]);
        } catch (err) {
            console.error('Initial data load failed:', err);
        } finally {
            isLoading = false;
        }
    });
</script>

{#if isLoading}
    <div class="text-center py-8 text-gray-500 dark:text-gray-400">
        Loading data...
    </div>
{:else}
  <section class="m-2 p-4 bg-gray-800 rounded-lg shadow-md">
    <h2 class="text-xl font-bold mb-4 dark:text-gray-200 text-center">Users</h2>
    <Table
      columns={userColumns}
      data={users}
      resource="users"
      teams={teams}
      teamMembers={teamMembers}
      onAdd={handleAdd}
      onDelete={handleDelete}
      onUpdate={handleUpdate}
    />
  </section>

  <div>
    <section class="m-2 p-4 bg-gray-800 rounded-lg shadow-md">
      <h2 class="text-xl font-bold mb-4 dark:text-gray-200 text-center">Teams</h2>
      <Table
        columns={teamColumns}
        data={teams}
        resource="teams"
        onAdd={handleAdd}
        onDelete={handleDelete}
        onUpdate={handleUpdate}
      />
    </section>
  
    <section class="m-2 p-4 bg-gray-800 rounded-lg shadow-md">
      <h2 class="text-xl font-bold mb-4 dark:text-gray-200 text-center">Metrics</h2>
      <Table
        columns={metricColumns}
        data={metrics}
        resource="metrics"
        teams={teams}
        onAdd={handleAdd}
        onDelete={handleDelete}
        onUpdate={handleUpdate}
      />
    </section>
  </div>

  <section class="m-2 p-4 bg-gray-800 rounded-lg shadow-md">
    <h2 class="text-xl font-bold mb-4 dark:text-gray-200 text-center">Team Members</h2>
    <Table
      columns={teamMemberColumns}
      data={teamMembers}
      resource="team-members"
      teams={teams}
      onAdd={handleAdd}
      onDelete={handleDelete}
      onUpdate={handleUpdate}
    />
  </section>
{/if}
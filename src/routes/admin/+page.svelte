<script lang="ts">
    import { onMount } from 'svelte';
    import Table from './components/Table.svelte';
    import type { Team, TeamMember, User } from '$lib/types';

    // let users: User[] = $state([]);
    let teams: Team[] = $state([]);
    let teamMembers: TeamMember[] = $state([]);
    let users: User[] = $state([]);

    // column definitions
    const teamColumns = ['Id', 'Team Name', 'Type', 'Edit'];
    const teamMemberColumns = ['Id', 'Name', 'Team', 'Edit'];
    const userColumns = ['Id', 'Username', 'Role', 'Team', 'Team Member', 'Edit'];

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

    function handleAdd(resource: string, newItem: any) {
      if (resource === 'teams') {
        teams = sortTeams([...teams, newItem]);
      } else if (resource === 'team-members') {
        teamMembers = sortTeamMembers([...teamMembers, newItem]);
      }
    }

    function handleDelete(resource: string, id: number) {
      if (resource === 'teams') {
        teams = sortTeams(teams.filter(team => team.id !== id));
      } else if (resource === 'team-members') {
        teamMembers = sortTeamMembers(teamMembers.filter(member => member.id !== id));
      } else if (resource === 'users') {
        users = sortUsers(users.filter(user => user.id !== id));
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

    onMount(() => {
        fetchTeams();
        fetchTeamMembers();
        fetchUsers();
    });
</script>

<section class="m-4">
  <h2 class="text-xl font-bold mb-4 text-center">Users</h2>
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

<section class="m-4">
  <h2 class="text-xl font-bold mb-4 text-center">Teams</h2>
  <Table
    columns={teamColumns}
    data={teams}
    resource="teams"
    onAdd={handleAdd}
    onDelete={handleDelete}
    onUpdate={handleUpdate}
  />
</section>

<section class="m-4">
  <h2 class="text-xl font-bold mb-4 text-center">Team Members</h2>
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
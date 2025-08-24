<script lang="ts">
    import { onMount } from 'svelte';
    import Table from './components/Table.svelte';
    import type { Team, TeamMember, User } from '$lib/types';

    // let users: User[] = $state([]);
    let teams: Team[] = [];
    let teamMembers: TeamMember[] = [];
    let users: User[] = [];

    // column definitions
    const teamColumns = ['Id', 'Team Name', 'Edit'];
    const teamMemberColumns = ['Id', 'Name', 'Team', 'Edit'];
    const userColumns = ['Id', 'Username', 'Role', 'Team', 'Team Member', 'Edit'];

    async function fetchTeams() {
        try {
            const response = await fetch('/api/teams');
            const data = await response.json();

            if (response.ok && Array.isArray(data)) {
                teams = data.sort((a, b) => a.name.localeCompare(b.name));
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
                teamMembers = data.sort((a, b) => a.name.localeCompare(b.name));
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
                users = data.sort((a, b) => a.username.localeCompare(b.username));
            } else {
                console.error('Unexpected response format: ', data);
            }
        } catch (err) {
            console.error('Failed to fetch users: ', err);
        }
    }

    onMount(() => {
        fetchTeams();
        fetchTeamMembers();
        fetchUsers();
    });
</script>

<h2 class="text-xl font-bold mb-2">Users</h2>
<Table
  columns={userColumns}
  data={users}
  resource="users"
  teams={teams}
  teamMembers ={teamMembers}
/>

<h2 class="text-xl font-bold mt-8 mb-2">Teams</h2>
<Table
  columns={teamColumns}
  data={teams}
  resource="teams"
/>

<h2 class="text-xl font-bold mt-8 mb-2">Team Members</h2>
<Table
  columns={teamMemberColumns}
  data={teamMembers}
  resource="team-members"
  teams={teams}
/>

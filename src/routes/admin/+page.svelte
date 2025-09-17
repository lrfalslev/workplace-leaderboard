<script lang="ts">
  import TeamsTable from './components/TeamsTable.svelte';
  import TeamMembersTable from './components/TeamMembersTable.svelte';
  import UsersTable from './components/UsersTable.svelte';
  import MetricsTable from './components/MetricsTable.svelte';
  import type { Team, TeamMember, User, Metric } from '$lib/types';

  let teams: Team[] = $state([]);
  let teamMembers: TeamMember[] = $state([]);
  let users: User[] = $state([]);
  let metrics: Metric[] = $state([]);
  
  const setTeams = (newTeams: Team[]) => teams = newTeams;
  const setTeamMembers = (newMembers: TeamMember[]) => teamMembers = newMembers;
  const setUsers = (newUsers: User[]) => users = newUsers;
  const setMetrics = (newMetrics: Metric[]) => metrics = newMetrics;
</script>

<section class="grid-cols-1 md:grid md:grid-cols-2 gap-4">
  <TeamsTable teams={teams} onTeamsChange={setTeams} />
  <MetricsTable metrics={metrics} teams={teams} onMetricsChange={setMetrics} />
  <TeamMembersTable teamMembers={teamMembers} teams={teams} onTeamMembersChange={setTeamMembers} />
  <UsersTable users={users} teams={teams} teamMembers={teamMembers} onUsersChange={setUsers} />
</section>
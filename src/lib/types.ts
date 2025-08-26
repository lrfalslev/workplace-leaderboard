export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  MANAGER = 'manager'
}

export const UserRoleLabels: Record<UserRole, string> = {
  [UserRole.USER]: 'User',
  [UserRole.ADMIN]: 'Admin',
  [UserRole.MANAGER]: 'Manager'
};

export enum TeamType {
  TICKET_AND_TOTAL = 'ticket_and_total',
  TICKET_ONLY = 'ticket_only'
}

export const TeamTypeLabels: Record<TeamType, string> = {
  [TeamType.TICKET_AND_TOTAL]: 'Tickets And Totals',
  [TeamType.TICKET_ONLY]: 'Tickets Only'
};

export type Team = {
    id: number;
    name: string;
    type: TeamType;
}

export type TeamMember = {
    id: number;
    name: string;
    teamId: number;
}

export type User = {
    id: number;
    username: string;
    role: UserRole;
    teamId: number | null;
    teamMemberId: number | null;
};

export type WorkItem = {
    id: number;
    date: string;
    ticketsAwarded: number;
    workItems: number;
    teamMemberId: number;
}

export type SummaryRow = {
    teamMemberId: number;
    teamMemberName: string;
    teamId: number;
    teamName: string;
    totalTickets: number;
    totalWorkItemTickets: number;
    totalWorkItems: number;
}
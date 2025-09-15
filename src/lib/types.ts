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

export enum WorkItemTypeType {
  TICKET_AND_TOTAL = 'ticket_and_total',
  TICKET_ONLY = 'ticket_only'
}

export const WorkItemTypeTypeLabels: Record<WorkItemTypeType, string> = {
  [WorkItemTypeType.TICKET_AND_TOTAL]: 'Tickets And Totals',
  [WorkItemTypeType.TICKET_ONLY]: 'Tickets Only'
};

export type Team = {
    id: number;
    name: string;
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

export type WorkItemType = {
    id: number | null;
    teamId: number;
    ticketName: string;
    workItemName: string;
    type: WorkItemTypeType;
    isLegacy: boolean;
}

export type WorkItem = {
    id: number | null;
    date: string;
    teamMemberId: number;
    ticketsAwarded: number;
    workItems: number | null;
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

export type BonusTicket = {
    id: number;
    date: string;
    description: string;
    ticketsAwarded: number;
    teamMemberId: number;
    managerId: number;
    teamMemberName: string;
    managerName: string;
};
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

export enum MetricType {
  TICKET_AND_TOTAL = 'ticket_and_total',
  TICKET_ONLY = 'ticket_only'
}

export const MetricTypeLabels: Record<MetricType, string> = {
  [MetricType.TICKET_AND_TOTAL]: 'Tickets And Totals',
  [MetricType.TICKET_ONLY]: 'Tickets Only'
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

export type Metric = {
  id: number | null;
  teamId: number;
  type: MetricType;
  qualifiedWorkLabel: string;
  totalWorkLabel: string;
  isLegacy: boolean;
}

export type Log = {
  id: number | null;
  date: string;
  teamMemberId: number;
  metricId: number;
  qualifiedWorkItems: number;
  totalWorkItems: number | null;
  qualifiedWorkLabel: string;
  totalWorkLabel: string | null;
  isLegacy: boolean;
  metricType: 'ticket_only' | 'ticket_and_total';
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
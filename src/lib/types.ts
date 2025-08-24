export enum UserRole {
    User = 'user',
    Admin = 'admin',
    Manager = 'manager'
}

export enum TeamType {
    TicketAndTotal = 'ticket_and_total',
    TicketOnly = 'ticket_only'
}

export type Team = {
    id: number;
    name: string;
}

export type TeamMember = {
    id: number;
    name: string;
    teamMemberId: number;
}

export type User = {
    id: number;
    username: string;
    role: UserRole;
    teamId: number | null;
    teamMemberId: number | null;
};

export type Topview = {
    date: string;
    firstTimeApprovals: number;
    totalSubmissions: number;
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
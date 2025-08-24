export enum UserRole {
    User = 'user',
    Admin = 'admin',
    Manager = 'manager'
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
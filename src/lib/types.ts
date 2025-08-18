export enum UserRole {
    User = 'user',
    Admin = 'admin',
}

export type User = {
    id: number;
    username: string;
    role: UserRole,
    projectCoordinatorId: number | null
};

export interface Topview {
    date: string;
    coordinatorId: number;
    firstTimeApprovals: number;
    totalSubmissions: number;
}

export interface Coordinator {
    id: number;
    name: string;
}
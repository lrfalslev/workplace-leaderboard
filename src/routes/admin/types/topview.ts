export interface Topview {
    date: string;
    coordinator: string;
    coordinatorId: number;
    firstTimeApprovals: number;
    totalSubmissions: number;
}

export interface Coordinator {
    id: number;
    name: string;
}
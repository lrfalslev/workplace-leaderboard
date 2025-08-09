import { writable } from 'svelte/store';

export type User = {
    id: number;
    username: string;
};

export const userStore = writable<User | null>(null);
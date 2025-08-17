import { derived } from 'svelte/store';
import { page } from '$app/stores';
import type { User } from '$lib/types';

export const user = derived(page, ($page) => $page.data.user as User | null);

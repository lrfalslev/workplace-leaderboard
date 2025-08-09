import { userStore } from '$lib/auth';

export const load = ({ data }) => {
    userStore.set(data.user);
};
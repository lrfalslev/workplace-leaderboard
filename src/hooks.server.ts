import type { Handle } from '@sveltejs/kit';
import { verifyToken } from '$lib/auth';
import { redirect } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
    const token = event.cookies.get('auth_token');

    if (token) {
        const user = verifyToken(token);
        if (user !== null) {
            event.locals.user = user;
        }
    }

    const adminRoutes = ['/admin', '/lottery'];

    if (!event.locals.user && adminRoutes.includes(event.url.pathname)) {
        throw redirect(303, '/');
    }

    return resolve(event);
};
import type { Handle } from '@sveltejs/kit';
import { verifyToken } from '$lib/auth';
import { redirect } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
    const token = event.cookies.get('auth_token');

    if (token) {
        const user = await verifyToken(token, event.platform!.env);
        if (user !== null) {
            event.locals.user = user;
        }
    }

    const adminRoutes = ['/admin', '/tickets', '/lottery'];

    const user = event.locals.user;
    if (adminRoutes.includes(event.url.pathname) && (!user || user.role !== 'admin')) {
        throw redirect(303, '/');
    }

    return resolve(event);
};
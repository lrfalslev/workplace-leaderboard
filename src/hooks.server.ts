import type { Handle } from '@sveltejs/kit';
import { verifyToken } from '$lib/auth.server';
import { redirect } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
    const token = event.cookies.get('auth_token');

    if (token) {
        const payload = verifyToken(token);
        if (payload?.id) {
            const result = await event.platform?.env.DB
                .prepare('SELECT id, username FROM users WHERE id = ?')
                .bind(payload.id)
                .run();

            const user = result?.results?.[0];
            if (user) {
                event.locals.user = user;
            }
        }
    }

    const adminRoutes = ['/admin', '/lottery'];

    if (!event.locals.user && adminRoutes.includes(event.url.pathname)) {
        throw redirect(303, '/');
    }

    return resolve(event);
};
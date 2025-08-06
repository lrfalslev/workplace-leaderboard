import { json } from '@sveltejs/kit';
import { type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ locals }) => {
    if (!locals.user) {
        return new Response('Unauthorized', { status: 401 });
    }
    return json(locals.user);
};


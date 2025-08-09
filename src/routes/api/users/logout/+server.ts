import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ cookies }) => {
    if (cookies.get('auth_token')) {
      cookies.delete('auth_token', { path: '/' });
    }
    return json({ success: true });
};
import { json, type RequestHandler } from '@sveltejs/kit';
import { hashPassword } from '$lib/auth';
import { UserRole } from '$lib/types';

export const GET: RequestHandler = async function ({ locals, platform }) {
    if (!locals.user || locals.user.role !== UserRole.Admin) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const queryResult = await platform?.env.DB.prepare('SELECT id, username, role FROM users').all();
    return json(queryResult?.results);
};

export const POST: RequestHandler = async function ({ request, platform }) {
    const user = await request.json() as {
        username: string;
        password: string;
    };
    const hashed = await hashPassword(user.password);

    try {
        const db = platform?.env.DB;
        
        await db?.prepare('INSERT INTO users (username, password) VALUES (?, ?)')
            .bind(user.username, hashed)
            .run();
            return new Response('User created', { status: 201 });
    } catch (err) {
        console.error(err);
        return new Response('Signup failed', { status: 400 });
    }
};

export const PUT: RequestHandler = async function ({ locals, request, platform }) {
    if (!locals.user || locals.user.role !== UserRole.Admin) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, role } = await request.json() as { id: number, role: string };

    try {
        await platform?.env.DB.prepare('UPDATE users SET role = ? WHERE id = ?')
            .bind(role, id)
            .run();

        return json({ success: true });
    } catch (err) {
        console.error('Failed to update user role:', err);
        return new Response('Internal Error', { status: 500 });
    }
};

export const DELETE: RequestHandler = async function ({ locals, url, platform }) {
    if (!locals.user || locals.user.role !== UserRole.Admin) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = Number(url.searchParams.get('id'));

    if (!id || typeof id !== 'number') {
        return new Response('Invalid or missing ID', { status: 400 });
    }

    try {
        const result = await platform?.env.DB.prepare('DELETE FROM users WHERE id = ?')
            .bind(id)
            .run();

        return json({ success: true, deleted: result?.meta.changed_db });
    } catch (err) {
        console.error('Failed to delete user:', err);
        return new Response('Internal Error', { status: 500 });
    }
};
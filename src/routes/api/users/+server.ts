import { json, type RequestHandler } from '@sveltejs/kit';
import { hashPassword } from '$lib/auth';
import { UserRole } from '$lib/types';

export const GET: RequestHandler = async function ({ locals, platform }) {
    if (!locals.user || locals.user.role !== UserRole.ADMIN) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const queryResult = await platform?.env.DB.prepare('SELECT id, username, role, team_id, team_member_id FROM users').all();
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
            
        const newUser = await platform?.env.DB
            .prepare('SELECT * FROM users WHERE id = last_insert_rowid()')
            .first();

        return json(newUser);
    } catch (err) {
        console.error(err);
        return new Response('Signup failed', { status: 400 });
    }
};

export const PUT: RequestHandler = async function ({ locals, request, platform }) {
    if (!locals.user || locals.user.role !== UserRole.ADMIN) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, role, teamId, teamMemberId } = await request.json() as { 
        userId: number,
        role: string,
        teamId: number | null,
        teamMemberId: number | null
    };

    try {
        await platform?.env.DB
            .prepare(`UPDATE users 
                        SET role = ?, team_id = ?, team_member_id = ? 
                        WHERE id = ?`)
            .bind(role, teamId, teamMemberId, userId)
            .run();
            
        const updatedUser = await platform?.env.DB
            .prepare('SELECT * FROM users WHERE id = ?')
            .bind(userId)
            .first();

        return json(updatedUser);
    } catch (err) {
        console.error('Failed to update user: ', err);
        return new Response('Internal Error', { status: 500 });
    }
};

export const DELETE: RequestHandler = async function ({ locals, url, platform }) {
    if (!locals.user || locals.user.role !== UserRole.ADMIN) {
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
        console.error('Failed to delete user: ', err);
        return new Response('Internal Error', { status: 500 });
    }
};
import { UserRole } from '$lib/types';
import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async function ({ platform }) {
    const queryResult = await platform?.env.DB.prepare('SELECT * FROM teams').all();
    return json(queryResult?.results);
};

export const POST: RequestHandler = async function ({ locals, request, platform }) {
    if (!locals.user || locals.user.role !== UserRole.Admin) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { name } = await request.json() as { name: string };

    try {
        await platform?.env.DB.prepare('INSERT INTO teams (name) VALUES (?)')
            .bind(name)
            .run();
            
        const newTeam = await platform?.env.DB
            .prepare('SELECT * FROM teams WHERE id = last_insert_rowid()')
            .first();

        return json(newTeam);
    } catch (err) {
        console.error('Failed to insert team: ', err);
        return new Response('Internal Error', { status: 500 });
    }
};

export const PUT: RequestHandler = async function ({ locals, request, platform }) {
    if (!locals.user || locals.user.role !== UserRole.Admin) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { teamId, name } = await request.json() as { teamId: number, name: string };

    try {
        await platform?.env.DB.prepare('UPDATE teams SET name = ? WHERE id = ?')
            .bind(name, teamId)
            .run();
            
        const updatedTeam = await platform?.env.DB
            .prepare('SELECT * FROM teams WHERE id = ?')
            .bind(teamId)
            .first();

        return json(updatedTeam);
    } catch (err) {
        console.error('Failed to update team: ', err);
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
        const result = await platform?.env.DB.prepare('DELETE FROM teams WHERE id = ?')
            .bind(id)
            .run();

        return json({ success: true, deleted: result?.meta.changed_db });
    } catch (err) {
        console.error('Failed to delete team: ', err);
        return new Response('Internal Error', { status: 500 });
    }
};
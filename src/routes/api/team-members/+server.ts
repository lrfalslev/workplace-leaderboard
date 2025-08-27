import { UserRole } from '$lib/types';
import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async function ({ platform }) {
    const queryResult = await platform?.env.DB
        .prepare(`
            SELECT 
                id,
                name,
                team_id AS teamId
            FROM team_members
        `)
        .all();
    return json(queryResult?.results);
};

export const POST: RequestHandler = async function ({ locals, request, platform }) {
    if (!locals.user || locals.user.role !== UserRole.ADMIN) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { name, teamId } = await request.json() as { name: string, teamId: number };

    try {
        await platform?.env.DB.prepare('INSERT INTO team_members (name, team_id) VALUES (?, ?)')
            .bind(name, teamId)
            .run();

        const newTeamMember = await platform?.env.DB
            .prepare('SELECT * FROM team_members WHERE id = last_insert_rowid()')
            .first();

        return json(newTeamMember);
    } catch (err) {
        console.error('Failed to insert team member: ', err);
        return new Response('Internal Error', { status: 500 });
    }
};

export const PUT: RequestHandler = async function ({ locals, request, platform }) {
    if (!locals.user || locals.user.role !== UserRole.ADMIN) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { teamMemberId, name, teamId } = await request.json() as { teamMemberId: number, name: string, teamId: number };

    try {
        await platform?.env.DB.prepare('UPDATE team_members SET name = ?, team_id = ? WHERE id = ?')
            .bind(name, teamId, teamMemberId)
            .run();
            
        const updatedTeamMember = await platform?.env.DB
            .prepare('SELECT * FROM team_members WHERE id = ?')
            .bind(teamMemberId)
            .first();

        return json(updatedTeamMember);
    } catch (err) {
        console.error('Failed to update team member: ', err);
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
        const result = await platform?.env.DB.prepare('DELETE FROM team_members WHERE id = ?')
            .bind(id)
            .run();

        return json({ success: true, deleted: result?.meta.changed_db });
    } catch (err) {
        console.error('Failed to delete team member: ', err);
        return new Response('Internal Error', { status: 500 });
    }
};
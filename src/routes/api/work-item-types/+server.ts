import { WorkItemTypeType, UserRole } from '$lib/types';
import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async function ({ platform }) {
    const queryResult = await platform?.env.DB
        .prepare(`
            SELECT 
                id,
                team_id AS teamId,
                ticket_name AS ticketName,
                work_item_name AS workItemName,
                type,
                is_legacy AS isLegacy
            FROM work_item_types
        `)
        .all();

    return json(queryResult?.results);
};

export const POST: RequestHandler = async function ({ locals, request, platform }) {
    if (!locals.user || locals.user.role !== UserRole.ADMIN) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { teamId, ticketName, workItemName, type, isLegacy } = await request.json() as {
        teamId: number;
        ticketName: string;
        workItemName?: string;
        type: WorkItemTypeType;
        isLegacy?: boolean;
    };

    try {
        await platform?.env.DB.prepare(`
            INSERT INTO work_item_types (team_id, ticket_name, work_item_name, type, is_legacy)
            VALUES (?, ?, ?, ?, ?)
        `)
        .bind(teamId, ticketName, workItemName ?? null, type, isLegacy ? 1 : 0)
        .run();

        const newItem = await platform?.env.DB
            .prepare(`
                SELECT 
                    id,
                    team_id AS teamId,
                    ticket_name AS ticketName,
                    work_item_name AS workItemName,
                    type,
                    is_legacy AS isLegacy
                FROM work_item_types
                WHERE id = last_insert_rowid()
            `)
            .first();

        return json(newItem);
    } catch (err) {
        console.error('Failed to insert workItemType: ', err);
        return new Response('Internal Error', { status: 500 });
    }
};

export const PUT: RequestHandler = async function ({ locals, request, platform }) {
    if (!locals.user || locals.user.role !== UserRole.ADMIN) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, teamId, ticketName, workItemName, type, isLegacy } = await request.json() as {
        id: number;
        teamId: number;
        ticketName: string;
        workItemName?: string;
        type: WorkItemTypeType;
        isLegacy?: boolean;
    };

    try {
        await platform?.env.DB.prepare(`
            UPDATE work_item_types
            SET team_id = ?, ticket_name = ?, work_item_name = ?, type = ?, is_legacy = ?
            WHERE id = ?
        `)
        .bind(teamId, ticketName, workItemName ?? null, type, isLegacy ? 1 : 0, id)
        .run();

        const updatedItem = await platform?.env.DB
            .prepare(`
                SELECT 
                    id,
                    team_id AS teamId,
                    ticket_name AS ticketName,
                    work_item_name AS workItemName,
                    type,
                    is_legacy AS isLegacy
                FROM work_item_types
                WHERE id = ?
            `)
            .bind(id)
            .first();

        return json(updatedItem);
    } catch (err) {
        console.error('Failed to update work_item_type: ', err);
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
        const result = await platform?.env.DB.prepare(`
            DELETE FROM work_item_types WHERE id = ?
        `)
        .bind(id)
        .run();

        return json({ success: true, deleted: result?.meta.changed_db });
    } catch (err) {
        console.error('Failed to delete work_item_type: ', err);
        return new Response('Internal Error', { status: 500 });
    }
};

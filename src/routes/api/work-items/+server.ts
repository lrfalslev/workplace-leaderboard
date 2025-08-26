import { UserRole } from '$lib/types';
import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async function ({ platform }) {
    const queryResult = await platform?.env.DB
        .prepare(`
            SELECT 
                id,
                date,
                tickets_awarded AS ticketsAwarded,
                work_items AS workItems,
                team_member_id AS teamMemberId
            FROM work_items
        `)
        .all();
    return json(queryResult?.results);
};

export const POST: RequestHandler = async function ({ locals, request, platform }) {
    if (!locals.user || locals.user.role !== UserRole.ADMIN) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const topviews = await request.json() as {
        date: string;
        ticketsAwarded: number;
        workItems: number;
        teamMemberId: number;
    }[];

    try {
        const db = platform?.env.DB;

        for (const topview of topviews) {
            const formattedDate = new Date(topview.date).toISOString().split('T')[0];

            await db?.prepare(`
                INSERT INTO work_items (date, tickets_awarded, work_items, team_member_id)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(date, team_member_id) DO UPDATE SET
                    tickets_awarded = excluded.tickets_awarded,
                    work_items = excluded.work_items
            `)
            .bind(formattedDate, topview.ticketsAwarded, topview.workItems, topview.teamMemberId)
            .run();
        }

        return json({ success: true });
    } catch (err) {
        console.error('Failed to upsert topviews: ', err);
        return new Response('Internal Error', { status: 500 });
    }
};

export const DELETE: RequestHandler = async function ({ locals, request, platform }) {
    if (!locals.user || locals.user.role !== UserRole.ADMIN) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { ticketIds } = await request.json() as { ticketIds: number[] };

    if (!Array.isArray(ticketIds) || ticketIds.length === 0) {
        return json({ error: 'No IDs provided' }, { status: 400 });
    }

    try {
        const placeholders = ticketIds.map(() => '?').join(', ');
        const result = await platform?.env.DB.prepare(`DELETE FROM work_items WHERE id IN (${placeholders})`)
            .bind(...ticketIds)
            .run();

        return json({ success: true, deleted: result?.meta.changed_db });
    } catch (err) {
        console.error('Failed to delete topviews: ', err);
        return new Response('Internal Error', { status: 500 });
    }
};
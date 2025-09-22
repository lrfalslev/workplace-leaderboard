import { UserRole } from '$lib/types';
import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async function ({ platform }) {
    const queryResult = await platform?.env.DB
        .prepare(`
            SELECT 
                id,
                date,
                team_member_id AS teamMemberId,
                metric_id AS metricId,
                qualified_work_items AS qualifiedWorkItems,
                total_work_items AS totalWorkItems,
            FROM logs
        `)
        .all();
        
    return json(queryResult?.results);
};

export const POST: RequestHandler = async function ({ locals, request, platform }) {
    if (!locals.user || (locals.user.role !== UserRole.ADMIN && locals.user.role !== UserRole.MANAGER)) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workItems = await request.json() as {
        date: string;
        teamMemberId: number;
        metricId: number;
        qualifiedWorkItems: number;
        totalWorkItems: number;
    }[];

    try {
        const db = platform?.env.DB;

        for (const workItem of workItems) {
            const formattedDate = new Date(workItem.date).toISOString().split('T')[0];

            await db?.prepare(`
                INSERT INTO logs (date, team_member_id, metric_id, qualified_work_items, total_work_items)
                VALUES (?, ?, ?, ?, ?)
                ON CONFLICT(date, team_member_id, metric_id) DO UPDATE SET
                    qualified_work_items = excluded.qualified_work_items,
                    total_work_items = excluded.total_work_items
            `)
            .bind(formattedDate, workItem.teamMemberId, workItem.metricId, workItem.qualifiedWorkItems, workItem.totalWorkItems)
            .run();
        }

        const updatedItems: any[] = [];

        for (const workItem of workItems) {
            const formattedDate = new Date(workItem.date).toISOString().split('T')[0];

            const item = await db?.prepare(`
                SELECT 
                    id,
                    date,
                    team_member_id AS teamMemberId,
                    metric_id AS metricId,
                    qualified_work_items AS qualifiedWorkItems,
                    total_work_items AS totalWorkItems
                FROM logs
                WHERE date = ? AND team_member_id = ? AND metric_id = ?
            `)
            .bind(formattedDate, workItem.teamMemberId, workItem.metricId)
            .first();

            if (item)
                updatedItems.push(item);
        }

        return json(updatedItems);
    } catch (err) {
        console.error('Failed to upsert logs: ', err);
        return new Response('Internal Error', { status: 500 });
    }
};

export const DELETE: RequestHandler = async function ({ locals, request, platform }) {
    if (!locals.user || (locals.user.role !== UserRole.ADMIN && locals.user.role !== UserRole.MANAGER)) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { logIds } = await request.json() as { logIds: number[] };

    if (!Array.isArray(logIds) || logIds.length === 0) {
        return json({ error: 'No IDs provided' }, { status: 400 });
    }

    try {
        const placeholders = logIds.map(() => '?').join(', ');
        const result = await platform?.env.DB.prepare(`DELETE FROM logs WHERE id IN (${placeholders})`)
            .bind(...logIds)
            .run();

        return json({ success: true, deleted: result?.meta.changed_db });
    } catch (err) {
        console.error('Failed to delete logs: ', err);
        return new Response('Internal Error', { status: 500 });
    }
};
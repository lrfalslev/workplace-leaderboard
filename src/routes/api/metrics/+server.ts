import { MetricType, UserRole } from '$lib/types';
import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async function ({ platform }) {
    const queryResult = await platform?.env.DB
        .prepare(`
            SELECT 
                id,
                team_id AS teamId,
                type,
                qualified_work_label AS qualifiedWorkLabel,
                total_work_label AS totalWorkLabel,
                is_legacy AS isLegacy
            FROM metrics
        `)
        .all();

    return json(queryResult?.results);
};

export const POST: RequestHandler = async function ({ locals, request, platform }) {
    if (!locals.user || locals.user.role !== UserRole.ADMIN) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { teamId, type, qualifiedWorkLabel, totalWorkLabel, isLegacy } = await request.json() as {
        teamId: number;
        type: MetricType;
        qualifiedWorkLabel: string;
        totalWorkLabel?: string;
        isLegacy?: boolean;
    };

    try {
        await platform?.env.DB.prepare(`
            INSERT INTO metrics (team_id, type, qualified_work_label, total_work_label, is_legacy)
            VALUES (?, ?, ?, ?, ?)
        `)
        .bind(teamId, type, qualifiedWorkLabel, totalWorkLabel ?? null, isLegacy ? 1 : 0)
        .run();

        const newMetric = await platform?.env.DB
            .prepare(`
                SELECT 
                    id,
                    team_id AS teamId,
                    type,
                    qualified_work_label AS qualifiedWorkLabel,
                    total_work_label AS totalWorkLabel,
                    is_legacy AS isLegacy
                FROM metrics
                WHERE id = last_insert_rowid()
            `)
            .first();

        return json(newMetric);
    } catch (err) {
        console.error('Failed to insert metric: ', err);
        return new Response('Internal Error', { status: 500 });
    }
};

export const PUT: RequestHandler = async function ({ locals, request, platform }) {
    if (!locals.user || locals.user.role !== UserRole.ADMIN) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, teamId, type, qualifiedWorkLabel, totalWorkLabel, isLegacy } = await request.json() as {
        id: number;
        teamId: number;
        type: MetricType;
        qualifiedWorkLabel: string;
        totalWorkLabel?: string;
        isLegacy?: boolean;
    };

    try {
        await platform?.env.DB.prepare(`
            UPDATE metrics
            SET team_id = ?, type = ?, qualified_work_label = ?, total_work_label = ?, is_legacy = ?
            WHERE id = ?
        `)
        .bind(teamId, type, qualifiedWorkLabel, totalWorkLabel ?? null, isLegacy ? 1 : 0, id)
        .run();

        const updatedMetric = await platform?.env.DB
            .prepare(`
                SELECT 
                    id,
                    team_id AS teamId,
                    type,
                    qualified_work_label AS qualifiedWorkLabel,
                    total_work_label AS totalWorkLabel,
                    is_legacy AS isLegacy
                FROM metrics
                WHERE id = ?
            `)
            .bind(id)
            .first();

        return json(updatedMetric);
    } catch (err) {
        console.error('Failed to update metric: ', err);
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
            DELETE FROM metrics WHERE id = ?
        `)
        .bind(id)
        .run();

        return json({ success: true, deleted: result?.meta.changed_db });
    } catch (err) {
        console.error('Failed to delete metric: ', err);
        return new Response('Internal Error', { status: 500 });
    }
};

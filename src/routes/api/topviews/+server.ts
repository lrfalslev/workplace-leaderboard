import { UserRole } from '$lib/types';
import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async function ({ platform }) {
    const queryResult = await platform?.env.DB
        .prepare(`
            SELECT 
                topviews.date,
                projectCoordinatorId AS coordinatorId,
                topviews.firstTimeApprovals,
                topviews.totalSubmissions
            FROM topviews
        `)
        .all();
    return json(queryResult?.results);
};

export const POST: RequestHandler = async function ({ locals, request, platform }) {
    if (!locals.user || locals.user.role !== UserRole.Admin) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const topviews = await request.json() as {
        projectCoordinatorId: number;
        date: string;
        firstTimeApprovals: number;
        totalSubmissions: number;
    }[];

    try {
        const db = platform?.env.DB;

        for (const topview of topviews) {
            const formattedDate = new Date(topview.date).toISOString().split('T')[0];

            await db?.prepare(`
                INSERT INTO topviews (projectCoordinatorId, date, firstTimeApprovals, totalSubmissions)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(projectCoordinatorId, date) DO UPDATE SET
                    firstTimeApprovals = excluded.firstTimeApprovals,
                    totalSubmissions = excluded.totalSubmissions
            `)
            .bind(topview.projectCoordinatorId, formattedDate, topview.firstTimeApprovals, topview.totalSubmissions)
            .run();
        }

        return json({ success: true });
    } catch (err) {
        console.error('Failed to upsert topviews.', err);
        return new Response('Internal Error', { status: 500 });
    }
};
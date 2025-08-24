import { UserRole } from '$lib/types';
import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async function ({ platform }) {
    const queryResult = await platform?.env.DB
        .prepare(`
            SELECT 
                date,
                first_time_approvals,
                total_submissions,
                team_member_id
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
        date: string;
        firstTimeApprovals: number;
        totalSubmissions: number;
        teamMemberId: number;
    }[];

    try {
        const db = platform?.env.DB;

        for (const topview of topviews) {
            const formattedDate = new Date(topview.date).toISOString().split('T')[0];

            await db?.prepare(`
                INSERT INTO topviews (date, first_time_approvals, total_submissions, team_member_id)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(date, team_member_id) DO UPDATE SET
                    firstTimeApprovals = excluded.firstTimeApprovals,
                    totalSubmissions = excluded.totalSubmissions
            `)
            .bind(formattedDate, topview.firstTimeApprovals, topview.totalSubmissions, topview.teamMemberId)
            .run();
        }

        return json({ success: true });
    } catch (err) {
        console.error('Failed to upsert topviews: ', err);
        return new Response('Internal Error', { status: 500 });
    }
};

export const DELETE: RequestHandler = async function ({ locals, request, platform }) {
    if (!locals.user || locals.user.role !== UserRole.Admin) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { date } = await request.json() as { date: string };

    try {
        const result = await platform?.env.DB.prepare('DELETE FROM topviews WHERE date = ?')
            .bind(date)
            .run();

        return json({ success: true, deleted: result?.meta.changed_db });
    } catch (err) {
        console.error('Failed to delete topviews: ', err);
        return new Response('Internal Error', { status: 500 });
    }
};
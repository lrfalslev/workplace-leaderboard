import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async function ({ platform }) {
    const queryResult = await platform?.env.DB
        .prepare(`
            SELECT 
                topviews.date,
                projectCoordinators.name AS coordinator,
                projectCoordinators.id AS coordinatorId,
                topviews.firstTimeApprovals,
                topviews.totalSubmissions
            FROM projectCoordinators
            LEFT JOIN topviews ON topviews.projectCoordinatorId = projectCoordinators.id
        `)
        .all();
    return json(queryResult?.results);
};

export const POST: RequestHandler = async function ({ request, platform }) {
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
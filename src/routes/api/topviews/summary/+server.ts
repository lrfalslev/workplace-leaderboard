import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async function ({ platform }) {
    const queryResult = await platform?.env.DB
        .prepare(`
            SELECT 
                projectCoordinators.id AS coordinatorId,
                projectCoordinators.name AS coordinatorName,
                SUM(topviews.firstTimeApprovals) AS totalFirstTimeApprovals,
                SUM(topviews.totalSubmissions) AS totalSubmissions
            FROM projectCoordinators
            LEFT JOIN topviews ON topviews.projectCoordinatorId = projectCoordinators.id
            GROUP BY projectCoordinators.id, projectCoordinators.name
        `)
        .all();

    if (!queryResult?.results) {
        return new Response('Failed to retrieve summary', { status: 500 });
    }

    return json(queryResult?.results);
};

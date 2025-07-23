import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async function ({ platform }) {
    const queryResult = await platform?.env.DB
        .prepare(`
            SELECT 
                projectCoordinators.name AS coordinator,
                SUM(topviews.firstTimeApprovals) AS totalFirstTimeApprovals,
                SUM(topviews.totalSubmissions) AS totalSubmissions
            FROM projectCoordinators
            LEFT JOIN topviews ON topviews.projectCoordinatorId = projectCoordinators.id
            GROUP BY topviews.projectCoordinatorId, coordinator
        `)
        .all();

    if (!queryResult?.results) {
        return new Response('Failed to retrieve summary', { status: 500 });
    }

    return json(queryResult?.results);
};

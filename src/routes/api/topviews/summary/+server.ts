import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async function ({ platform }) {
    const queryResult = await platform?.env.DB
        .prepare(`
            SELECT 
                team_members.id AS teamMemberId,
                team_members.name AS teamMemberName,
                SUM(topviews.first_time_approvals) AS totalFirstTimeApprovals,
                SUM(topviews.total_submissions) AS totalSubmissions
            FROM team_members
            LEFT JOIN topviews ON topviews.team_member_id = team_members.id
            GROUP BY team_members.id, team_members.name
        `)
        .all();

    if (!queryResult?.results) {
        return new Response('Failed to retrieve summary', { status: 500 });
    }

    return json(queryResult?.results);
};

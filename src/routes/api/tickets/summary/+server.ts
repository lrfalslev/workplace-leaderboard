import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async function ({ platform }) {
    const queryResult = await platform?.env.DB
        .prepare(`
            SELECT 
                team_members.id AS teamMemberId,
                team_members.name AS teamMemberName,
                teams.id AS teamId,
                teams.name AS teamName,
                SUM(COALESCE(work_items.tickets_awarded, 0)) + SUM(COALESCE(bonus_tickets.tickets_awarded, 0)) AS totalTickets,
                SUM(work_items.tickets_awarded) AS totalWorkItemTickets,
                SUM(work_items.total_work_items) AS totalWorkItems
            FROM team_members
            LEFT JOIN work_items ON work_items.team_member_id = team_members.id
            LEFT JOIN teams ON team_members.team_id = teams.id
            LEFT JOIN bonus_tickets ON bonus_tickets.team_member_id = team_members.id
            GROUP BY team_members.id, team_members.name, teams.name
        `)
        .all();

    if (!queryResult?.results) {
        return new Response('Failed to retrieve topview summary: ', { status: 500 });
    }

    return json(queryResult?.results);
};

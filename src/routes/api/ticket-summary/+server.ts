import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async function ({ platform }) {
    const queryResult = await platform?.env.DB
        .prepare(`
            SELECT 
                team_members.id AS teamMemberId,
                team_members.name AS teamMemberName,
                teams.id AS teamId,
                teams.name AS teamName,
                COALESCE(work_ticket_totals.total_work_item_tickets, 0) + COALESCE(bonus_ticket_totals.total_bonus_tickets, 0) AS totalTickets,
                COALESCE(work_ticket_totals.total_work_item_tickets, 0) AS totalWorkItemTickets,
                COALESCE(work_ticket_totals.total_work_items, 0) AS totalWorkItems
            FROM team_members
            LEFT JOIN teams ON team_members.team_id = teams.id
            LEFT JOIN (
                SELECT team_member_id, SUM(qualified_work_items) AS total_work_item_tickets, SUM(total_work_items) AS total_work_items
                FROM logs
                GROUP BY team_member_id
            ) work_ticket_totals ON work_ticket_totals.team_member_id = team_members.id
            LEFT JOIN (
                SELECT team_member_id, SUM(tickets_awarded) AS total_bonus_tickets
                FROM bonus_tickets
                GROUP BY team_member_id
            ) bonus_ticket_totals ON bonus_ticket_totals.team_member_id = team_members.id
            GROUP BY team_members.id, team_members.name, teams.id, teams.name
        `)
        .all();

    if (!queryResult?.results) {
        return new Response('Failed to retrieve topview summary: ', { status: 500 });
    }

    return json(queryResult?.results);
};
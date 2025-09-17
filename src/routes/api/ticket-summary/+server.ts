import { json, type RequestHandler } from '@sveltejs/kit';
import { UserRole } from '$lib/types';

export const GET: RequestHandler = async function ({ locals, platform }) {
    const role = locals.user?.role;

    let query: string;

    if (role === UserRole.ADMIN) {
        query = `
            SELECT 
                team_members.id AS teamMemberId,
                team_members.name AS teamMemberName,
                teams.id AS teamId,
                teams.name AS teamName,
                metrics.id AS metricId,
                metrics.is_legacy AS isLegacy,
                metrics.qualified_work_label AS qualifiedWorkLabel,
                metrics.total_work_label AS totalWorkLabel,
                COALESCE(SUM(logs.qualified_work_items), 0) AS totalWorkItemTickets,
                COALESCE(SUM(logs.total_work_items), 0) AS totalWorkItems,
                COALESCE(bonus_totals.total_bonus_tickets, 0) AS bonusTickets
            FROM team_members
            JOIN teams ON team_members.team_id = teams.id
            JOIN metrics ON metrics.team_id = teams.id
            LEFT JOIN logs 
                ON logs.team_member_id = team_members.id
                AND logs.metric_id = metrics.id
            LEFT JOIN (
                SELECT team_member_id, SUM(tickets_awarded) AS total_bonus_tickets
                FROM bonus_tickets
                GROUP BY team_member_id
            ) AS bonus_totals ON bonus_totals.team_member_id = team_members.id
            GROUP BY 
                team_members.id, team_members.name,
                teams.id, teams.name,
                metrics.id, metrics.is_legacy, metrics.qualified_work_label, metrics.total_work_label,
                bonus_totals.total_bonus_tickets
            ORDER BY teams.id, team_members.name, metrics.id
        `;
    } else {
        query = `
        SELECT 
            team_members.id AS teamMemberId,
            team_members.name AS teamMemberName,
            teams.id AS teamId,
            teams.name AS teamName,
            COALESCE(work_ticket_totals.total_work_item_tickets, 0) AS totalWorkItemTickets,
            COALESCE(work_ticket_totals.total_work_items, 0) AS totalWorkItems,
            COALESCE(bonus_ticket_totals.total_bonus_tickets, 0) AS bonusTickets,
            COALESCE(work_ticket_totals.total_work_item_tickets, 0) 
            + COALESCE(bonus_ticket_totals.total_bonus_tickets, 0) AS totalTickets
        FROM team_members
        LEFT JOIN teams ON team_members.team_id = teams.id
        LEFT JOIN (
            SELECT team_member_id, SUM(qualified_work_items) AS total_work_item_tickets, SUM(total_work_items) AS total_work_items
            FROM logs
            GROUP BY team_member_id
        ) AS work_ticket_totals ON work_ticket_totals.team_member_id = team_members.id
        LEFT JOIN (
            SELECT team_member_id, SUM(tickets_awarded) AS total_bonus_tickets
            FROM bonus_tickets
            GROUP BY team_member_id
        ) AS bonus_ticket_totals ON bonus_ticket_totals.team_member_id = team_members.id
        GROUP BY team_members.id, team_members.name, teams.id, teams.name
        `;
    }

    const queryResult = await platform?.env.DB.prepare(query).all();

    if (!queryResult?.results) {
        return new Response('Failed to retrieve topview summary', { status: 500 });
    }

    return json(queryResult.results);
};
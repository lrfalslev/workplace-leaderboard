import { UserRole } from '$lib/types';
import { json, type RequestHandler } from '@sveltejs/kit';

const BONUS_TICKET_SELECT = `
    SELECT 
        bonus_tickets.id,
        bonus_tickets.date,
        bonus_tickets.description,
        bonus_tickets.tickets_awarded AS ticketsAwarded,
        bonus_tickets.team_member_id AS teamMemberId,
        bonus_tickets.manager_id AS managerId,
        team_members.name AS teamMemberName,
        users.username AS managerName
    FROM bonus_tickets
    JOIN team_members ON bonus_tickets.team_member_id = team_members.id
    LEFT JOIN users ON bonus_tickets.manager_id = users.id
`;

export const GET: RequestHandler = async ({ platform }) => {
    const result = await platform?.env.DB
        .prepare(`${BONUS_TICKET_SELECT}`)
        .all();

    return json(result?.results ?? []);
};

export const POST: RequestHandler = async ({ locals, request, platform }) => {
    if (!locals.user || locals.user.role !== UserRole.ADMIN) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { date, teamMemberId, description, ticketsAwarded } = await request.json() as {
        date: string;
        description: string;
        ticketsAwarded: number;
        teamMemberId: number;
    };    

    try {
        const formattedDate = new Date(date).toISOString().split('T')[0];

        await platform?.env.DB?.prepare(`
            INSERT INTO bonus_tickets (date, description, tickets_awarded, team_member_id, manager_id)
            VALUES (?, ?, ?, ?, ?)
        `)
        .bind(formattedDate, description, ticketsAwarded, teamMemberId, locals.user.id)
        .run();

        const newTicket = await platform?.env.DB
            .prepare(`${BONUS_TICKET_SELECT} WHERE bonus_tickets.id = last_insert_rowid()`)
            .first();

        return json(newTicket);
    } catch (err) {
        console.error('Failed to insert bonus tickets:', err);
        return json({ error: 'Internal Server Error' }, { status: 500 });
    }
};

export const PUT: RequestHandler = async ({ locals, request, platform }) => {
    if (!locals.user || locals.user.role !== UserRole.ADMIN) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ticket = await request.json() as {
        id: number;
        date: string;
        description: string;
        ticketsAwarded: number;
        teamMemberId: number;
    };

    try {
        const formattedDate = new Date(ticket.date).toISOString().split('T')[0];

        await platform?.env.DB?.prepare(`
            UPDATE bonus_tickets
            SET date = ?, description = ?, tickets_awarded = ?, team_member_id = ?, manager_id = ?
            WHERE id = ?
        `)
        .bind(formattedDate, ticket.description, ticket.ticketsAwarded, ticket.teamMemberId, locals.user.id, ticket.id)
        .run();

        const updatedTicket = await platform?.env.DB
            .prepare(`${BONUS_TICKET_SELECT} WHERE bonus_tickets.id = ?
            `)
            .bind(ticket.id)
            .first();

        return json(updatedTicket);
    } catch (err) {
        console.error('Failed to update bonus tickets:', err);
        return json({ error: 'Internal Server Error' }, { status: 500 });
    }
};

export const DELETE: RequestHandler = async ({ locals, url, platform }) => {
    if (!locals.user || locals.user.role !== UserRole.ADMIN) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ticketId = Number(url.searchParams.get('id'));

    if (!ticketId || isNaN(ticketId)) {
        return json({ error: 'Invalid or missing bonus ticket id' }, { status: 400 });
    }

    try {
        const result = await platform?.env.DB
            .prepare(`DELETE FROM bonus_tickets WHERE id = ?`)
            .bind(ticketId)
            .run();

        return json({ success: true, deleted: result?.meta.changed_db });
    } catch (err) {
        console.error('Failed to delete bonus ticket:', err);
        return json({ error: 'Internal Server Error' }, { status: 500 });
    }
};
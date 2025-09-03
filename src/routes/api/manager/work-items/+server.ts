import { UserRole } from '$lib/types';
import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ locals, platform }) => {
    const user = locals.user;

    if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.MANAGER)) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const baseQuery = `
        SELECT 
            work_items.id,
            work_items.date,
            work_items.tickets_awarded AS ticketsAwarded,
            work_items.work_items AS workItems,
            work_items.team_member_id AS teamMemberId
        FROM work_items
    `;

    const query = user.role === UserRole.ADMIN
        ? baseQuery
        : `${baseQuery}
           JOIN team_members ON work_items.team_member_id = team_members.id
           WHERE team_members.team_id = ?`;

    const result = user.role === UserRole.ADMIN
        ? await platform?.env.DB.prepare(query).all()
        : await platform?.env.DB.prepare(query).bind(user.teamId).all();

    return json(result?.results);
};
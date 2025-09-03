import { UserRole } from '$lib/types';
import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ locals, platform }) => {
    const user = locals.user;

    if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.MANAGER)) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const baseQuery = 'SELECT id, name, team_id AS teamId FROM team_members';

    const query = user.role === UserRole.ADMIN
        ? baseQuery
        : `${baseQuery}
           WHERE team_id = ?`;

    const result = user.role === UserRole.ADMIN
        ? await platform?.env.DB.prepare(query).all()
        : await platform?.env.DB.prepare(query).bind(user.teamId).all();

    return json(result?.results);
};
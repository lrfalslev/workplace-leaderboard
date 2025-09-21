import { UserRole } from '$lib/types';
import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ locals, platform }) => {
    const user = locals.user;

    if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.MANAGER)) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const baseQuery = `
        SELECT 
            id,
            team_id AS teamId,
            type,
            qualified_work_label AS qualifiedWorkLabel,
            total_work_label AS totalWorkLabel,
            is_legacy AS isLegacy
        FROM metrics
    `;

    const query = user.role === UserRole.ADMIN
        ? baseQuery
        : `${baseQuery}
           WHERE team_id = ?`;

    const result = user.role === UserRole.ADMIN
        ? await platform?.env.DB.prepare(query).all()
        : await platform?.env.DB.prepare(query).bind(user.teamId).all();

    return json(result?.results);
};
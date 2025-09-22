import { UserRole } from '$lib/types';
import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ locals, platform }) => {
    const user = locals.user;

    if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.MANAGER)) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const baseQuery = `
        SELECT 
            logs.id,
            logs.date,
            logs.team_member_id AS teamMemberId,
            logs.metric_id AS metricId,
            logs.qualified_work_items AS qualifiedWorkItems,
            logs.total_work_items AS totalWorkItems,
            metrics.qualified_work_label AS qualifiedWorkLabel,
            metrics.total_work_label AS totalWorkLabel,
            metrics.is_legacy AS isLegacy,
            type AS metricType
        FROM logs
        JOIN metrics ON metrics.id = logs.metric_id
    `;

    const query = user.role === UserRole.ADMIN
        ? baseQuery
        : `${baseQuery}
           JOIN team_members ON logs.team_member_id = team_members.id
           WHERE team_members.team_id = ?`;

    const result = user.role === UserRole.ADMIN
        ? await platform?.env.DB.prepare(query).all()
        : await platform?.env.DB.prepare(query).bind(user.teamId).all();

    return json(result?.results);
};
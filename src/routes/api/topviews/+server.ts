import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async function ({ platform }) {
    const queryResult = await platform?.env.DB
        .prepare(`
            SELECT 
                topviews.date,
                projectCoordinators.name AS coordinator,
                topviews.numerator,
                topviews.denominator
            FROM topviews
            JOIN projectCoordinators ON topviews.projectCoordinatorId = projectCoordinators.id
        `)
        .all();
    return json(queryResult);
};


export const POST: RequestHandler = async function ({ request, platform }) {
    const {
        projectCoordinatorId,
        date,
        numerator,
        denominator
    } = await request.json() as {
        projectCoordinatorId: number;
        date: string;
        numerator: number;
        denominator: number;
    };
    
    try {
        const formattedDate = new Date(date).toISOString().split('T')[0];
        
        await platform?.env.DB.prepare('INSERT INTO topviews (projectCoordinatorId, date, numerator, denominator) VALUES (?, ?, ?, ?)')
            .bind(projectCoordinatorId, formattedDate, numerator, denominator)
            .run();

        return json({
            success: true
        });
    } catch (err) {
        console.error('Failed to insert into topview:', err);
        return new Response('Internal Error', { status: 500 });
    }
};
import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async function ({ platform }) {
    const queryResult = await platform?.env.DB.prepare('SELECT * FROM projectCoordinators').all();
    return json(queryResult?.results);
};

export const POST: RequestHandler = async function ({ locals, request, platform }) {
    if (!locals.user) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { name } = await request.json() as { name: string };

    try {
        await platform?.env.DB.prepare('INSERT INTO projectCoordinators (name) VALUES (?)')
            .bind(name)
            .run();

        return json({ success: true });
    } catch (err) {
        console.error('Failed to insert into projectCoordinators:', err);
        return new Response('Internal Error', { status: 500 });
    }
};

export const PUT: RequestHandler = async function ({ locals, request, platform }) {
    if (!locals.user) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, name } = await request.json() as { id: number, name: string };

    try {
        await platform?.env.DB.prepare('UPDATE projectCoordinators SET name = ? WHERE id = ?')
            .bind(name, id)
            .run();

        return json({ success: true });
    } catch (err) {
        console.error('Failed to update into projectCoordinators:', err);
        return new Response('Internal Error', { status: 500 });
    }
};

export const DELETE: RequestHandler = async function ({ locals, url, platform }) {
    if (!locals.user) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = Number(url.searchParams.get('id'));

    if (!id || typeof id !== 'number') {
        return new Response('Invalid or missing ID', { status: 400 });
    }

    try {
        const result = await platform?.env.DB.prepare('DELETE FROM projectCoordinators WHERE id = ?')
            .bind(id)
            .run();

        return json({ success: true, deleted: result?.meta.changed_db });
    } catch (err) {
        console.error('Failed to delete projectCoordinator:', err);
        return new Response('Internal Error', { status: 500 });
    }
};
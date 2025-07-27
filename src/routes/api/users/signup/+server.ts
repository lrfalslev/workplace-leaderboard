import { json, type RequestHandler } from '@sveltejs/kit';
import { hashPassword } from '$lib/auth';

export const POST: RequestHandler = async function ({ request, platform }) {
    const user = await request.json() as {
        username: string;
        password: string;
    };
    const hashed = await hashPassword(user.password);

    try {
        const db = platform?.env.DB;
        
        await db?.prepare('INSERT INTO users (username, password) VALUES (?, ?)')
            .bind(user.username, hashed)
            .run();
            return new Response('User created', { status: 201 });
    } catch (err) {
        console.error(err);
        return new Response('Signup failed', { status: 400 });
    }
};

export const GET: RequestHandler = async function ({ platform }) {
    const queryResult = await platform?.env.DB.prepare('SELECT * FROM users').all();
    return json(queryResult?.results);
};
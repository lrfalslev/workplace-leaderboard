import { type RequestHandler } from '@sveltejs/kit';
import { verifyPassword } from '$lib/auth';

export const POST: RequestHandler = async ({ request, platform, cookies }) => {
  const raw = await request.json();

  if (
    typeof raw !== 'object' ||
    raw === null ||
    typeof (raw as any).username !== 'string' ||
    typeof (raw as any).password !== 'string'
  ) {
    return new Response('Invalid request format', { status: 400 });
  }

  const { username, password } = raw as { username: string; password: string };

  const result = await platform?.env.DB
    .prepare('SELECT * FROM users WHERE username = ?')
    .bind(username)
    .run();

  const user = result?.results?.[0];

  if (
    !user ||
    typeof user !== 'object' ||
    user === null ||
    typeof user.password !== 'string' ||
    typeof user.id !== 'number'
  ) {
    return new Response('User not found', { status: 404 });
  }

  const valid = await verifyPassword(password, user.password);

  if (!valid) {
    return new Response('Invalid credentials', { status: 401 });
  }

  cookies.set('session_id', String(user.id), {
    path: '/',
    httpOnly: true,
    secure: true,
    maxAge: 60 * 60 * 24
  });

  return new Response('Logged in', { status: 200 });
};
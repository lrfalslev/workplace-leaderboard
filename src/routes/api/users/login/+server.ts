import { json } from '@sveltejs/kit';
import { type RequestHandler } from '@sveltejs/kit';
import { verifyPassword, generateToken } from '$lib/auth';

export const POST: RequestHandler = async ({ request, platform, cookies }) => {
  const { username, password } = await request.json() as { username: string; password: string };

  const result = await platform?.env.DB
    .prepare('SELECT * FROM users WHERE username = ?')
    .bind(username)
    .run();

  const user = result?.results?.[0];
  if (!user || typeof user.password !== 'string' || typeof user.id !== 'number') {
    return json({ error: 'User not found' }, { status: 404 });
  }

  const valid = await verifyPassword(password, user.password);
  if (!valid) {
    return json({ error: 'Invalid credentials' }, { status: 401 });
  }
  const token = generateToken({ id: user.id, username: user.username });

  cookies.set('auth_token', token, {
    path: '/',
    httpOnly: true,
    sameSite: 'strict',
    secure: true, //set to false for dev
    maxAge: 60 * 60 * 24
  });

  return json({ success: true });
};
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { User } from './types';

//Passwords
const saltRounds = 10;
export async function hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(password: string, hashed: string): Promise<boolean> {
    return await bcrypt.compare(password, hashed);
}

const SECRET = process.env.JWT_SECRET as string;

export function generateToken(payload: User): string {
    if (!SECRET) throw new Error('JWT_SECRET not set');
    return jwt.sign(payload, SECRET, { expiresIn: '1d' });
}

export async function verifyToken(token: string, env: App.Platform['env']): Promise<User | null> {
    try {
        const decoded = jwt.verify(token, SECRET);
        if (typeof decoded === 'object' && decoded !== null) {
            const { id } = decoded as { id: string };
            const user = await env.DB
                .prepare('SELECT id, username, role FROM users WHERE id = ?')
                .bind(id)
                .first<User>();
            return user ?? null;
        }
    } catch (err) {
        console.warn('Token verification failed:', err);
    }
    return null;
}
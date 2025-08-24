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

export function generateToken(userId: number): string {
    if (!SECRET) throw new Error('JWT_SECRET not set');
    return jwt.sign({ userId }, SECRET, { expiresIn: '1d' });
}

export async function verifyToken(token: string, env: App.Platform['env']): Promise<User | null> {
    try {        
        const { userId } = jwt.verify(token, SECRET) as { userId: string };
        return await env.DB
            .prepare(`SELECT id, username, role, team_id, team_member_id FROM users WHERE id = ?`)
            .bind(userId)
            .first<User>() ?? null;
    } catch (err) {
        console.warn('Token verification failed:', err);
        return null;
    }
}
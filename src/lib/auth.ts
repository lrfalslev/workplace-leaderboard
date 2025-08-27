import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { User, UserRole } from './types';
import 'dotenv/config';

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

        const dbUser = await env.DB
            .prepare(`SELECT id, username, role, team_id, team_member_id FROM users WHERE id = ?`)
            .bind(userId)  
            .first() as { id: number; username: string; role: UserRole; team_id: number|null; team_member_id: number|null } | null;

        if (!dbUser) 
            return null;

        return {
            id: dbUser.id,
            username: dbUser.username,
            role: dbUser.role,
            teamId: dbUser.team_id,
            teamMemberId: dbUser.team_member_id
        } satisfies User;
    } catch (err) {
        console.warn('Token verification failed:', err);
        return null;
    }
}
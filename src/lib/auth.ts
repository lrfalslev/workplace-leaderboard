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

const SECRET = 'your-super-secure-secret'; // Use env var in production

export function generateToken(payload: User): string {
    return jwt.sign(payload, SECRET, { expiresIn: '1d' });
}

export function verifyToken(token: string): User | null {
    try {
        const decoded = jwt.verify(token, SECRET);
        if (typeof decoded === 'object' && decoded !== null) {
            return decoded as User;
        }
    } catch (err) {
        console.warn('Token verification failed:', err);
    }
    return null;
}
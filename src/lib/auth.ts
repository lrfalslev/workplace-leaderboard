import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { JwtPayload } from 'jsonwebtoken';

//DB passwords
const saltRounds = 10;
export async function hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(password: string, hashed: string): Promise<boolean> {
    return await bcrypt.compare(password, hashed);
}

//JWT tokens
const SECRET = 'your-super-secure-secret'; // Replace with env var in production

type TokenPayload = {
    id: number;
    username: string;
};

export function generateToken(payload: TokenPayload): string {
    return jwt.sign(payload, SECRET, { expiresIn: '1d' });
}

export function verifyToken(token: string): JwtPayload | null {
    try {
        const decoded = jwt.verify(token, SECRET);
        if (typeof decoded === 'object' && decoded !== null) {
            return decoded as JwtPayload;
        }
    } catch (err) {
        console.warn('Token verification failed:', err);
    }
    return null;
}
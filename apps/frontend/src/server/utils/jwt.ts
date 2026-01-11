// =============================================
// JWT Utilities - Edge-compatible signing and verification using jose
// =============================================

import { jwtVerify, SignJWT } from 'jose';

import { SESSION_TTL } from '@/constants/auth.constants';
import { JWT_SECRET } from '@/env';
import { type IJWTPayload } from '@/lib/interfaces/auth.interfaces';

const getSecret = () => new TextEncoder().encode(JWT_SECRET);

// signJWT: Create JWT token with payload
export const signJWT = async (payload: IJWTPayload): Promise<string> =>
    new SignJWT({ ...payload })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(`${SESSION_TTL}s`)
        .sign(getSecret());

// verifyJWT: Verify and decode JWT token
export const verifyJWT = async (token: string): Promise<IJWTPayload | undefined> => {
    try {
        const { payload } = await jwtVerify(token, getSecret());
        return payload as unknown as IJWTPayload;
    } catch {
        return undefined;
    }
};

'use server';
// =============================================
// Register Server Actions - User registration with auto-login
// =============================================

import { cookies, headers } from 'next/headers';

import { AUTH_COOKIE, COOKIE_CONFIG } from '@/constants/auth.constants';
import { RATE_LIMIT_AUTH } from '@/constants/rate-limit.constants';
import { prisma } from '@/server/db/prisma';
import { createDebugLog } from '@/server/utils/debugLog';
import { detectDevice, getClientIP } from '@/server/utils/device';
import { signJWT } from '@/server/utils/jwt';
import { hashPassword } from '@/server/utils/password';
import { consumeRateLimit } from '@/server/utils/rate-limit';
import { createSession } from '@/server/utils/session';

// =============================================
// Register User Action
// =============================================

interface IRegisterUserRequest {
    fullName: string;
    email: string;
    password: string;
    mobile?: string;
}

interface IRegisterUserResponse {
    success: boolean;
    error?: string;
    data?: { user: { id: string; fullName: string; email: string; avatarLink?: string } };
}

export const registerUserAction = async (params: IRegisterUserRequest): Promise<IRegisterUserResponse> => {
    const start = Date.now();
    const { fullName, email, password, mobile } = params;
    const h = await headers();
    const ip = getClientIP(h);
    const userAgent = h.get('user-agent') ?? '';

    // Rate limiting
    const rateLimitResult = await consumeRateLimit(ip, RATE_LIMIT_AUTH);
    if (!rateLimitResult.allowed) {
        await createDebugLog({ method: 'POST', url: '/auth/register/user', requestBody: { email }, responseBody: { error: 'Rate limited' }, status: 429, duration: Date.now() - start, stakeholder: 'USER' });
        return { success: false, error: 'Too many requests. Please try again later.' };
    }

    // Validation
    if (!fullName || !email || !password) {
        await createDebugLog({ method: 'POST', url: '/auth/register/user', requestBody: { email }, responseBody: { error: 'Validation failed' }, status: 400, duration: Date.now() - start, stakeholder: 'USER' });
        return { success: false, error: 'Full name, email, and password are required' };
    }
    if (password.length < 8) {
        await createDebugLog({ method: 'POST', url: '/auth/register/user', requestBody: { email }, responseBody: { error: 'Password too short' }, status: 400, duration: Date.now() - start, stakeholder: 'USER' });
        return { success: false, error: 'Password must be at least 8 characters' };
    }

    try {
        const normalizedEmail = email.toLowerCase().trim();
        const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });

        if (existingUser) {
            await createDebugLog({ method: 'POST', url: '/auth/register/user', requestBody: { email }, responseBody: { error: 'Email exists' }, status: 409, duration: Date.now() - start, stakeholder: 'USER' });
            return { success: false, error: 'Email is already registered' };
        }

        const user = await prisma.user.create({
            data: {
                fullName: fullName.trim(),
                email: normalizedEmail,
                password: await hashPassword(password),
                mobile: mobile?.trim(),
            },
        });

        // Create session using email as key
        const { session } = await createSession(user.email, 'USER', detectDevice(userAgent), ip, userAgent);

        // Include email in JWT for session operations
        const token = await signJWT({ userId: user.id, email: user.email, fullName: user.fullName, avatarLink: user.avatarLink ?? undefined, role: 'USER', sessionId: session.sessionId });

        const c = await cookies();
        c.set(AUTH_COOKIE.USER, token, COOKIE_CONFIG);

        await createDebugLog({ method: 'POST', url: '/auth/register/user', requestBody: { email }, responseBody: { success: true, userId: user.id }, status: 201, duration: Date.now() - start, stakeholder: 'USER', stakeholderId: user.id });
        return { success: true, data: { user: { id: user.id, fullName: user.fullName, email: user.email, avatarLink: user.avatarLink ?? undefined } } };
    } catch (error) {
        console.error('[registerUserAction]', error);
        await createDebugLog({ method: 'POST', url: '/auth/register/user', requestBody: { email }, responseBody: { error: 'Server error' }, status: 500, duration: Date.now() - start, stakeholder: 'USER', errorMessage: error instanceof Error ? error.message : 'Unknown' });
        return { success: false, error: 'An unexpected error occurred' };
    }
};

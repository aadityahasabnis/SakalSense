'use server';
// =============================================
// Login/Logout Server Actions - Authentication with cookie handling
// =============================================

import { cookies, headers } from 'next/headers';

import { AUTH_COOKIE, COOKIE_CONFIG } from '@/constants/auth.constants';
import { RATE_LIMIT_AUTH } from '@/constants/rate-limit.constants';
import { type ISession } from '@/lib/interfaces/auth.interfaces';
import { prisma } from '@/server/db/prisma';
import { createDebugLog } from '@/server/utils/debugLog';
import { detectDevice, getClientIP } from '@/server/utils/device';
import { signJWT, verifyJWT } from '@/server/utils/jwt';
import { verifyPassword } from '@/server/utils/password';
import { consumeRateLimit } from '@/server/utils/rate-limit';
import { createSession, invalidateSession } from '@/server/utils/session';
import { type StakeholderType } from '@/types/auth.types';

// =============================================
// Login Action
// =============================================

interface ILoginRequest {
    email: string;
    password: string;
    stakeholder: StakeholderType;
}

interface ILoginResponse {
    success: boolean;
    error?: string;
    data?: {
        user: { id: string; fullName: string; email: string; avatarLink?: string };
        sessionLimitExceeded?: boolean;
        activeSessions?: Array<ISession>;
    };
}

// getEntityByEmail: Common lookup for any stakeholder type
const getEntityByEmail = async (email: string, stakeholder: StakeholderType) => {
    const normalized = email.toLowerCase().trim();
    switch (stakeholder) {
        case 'USER':
            return prisma.user.findUnique({ where: { email: normalized } });
        case 'ADMIN':
            return prisma.admin.findUnique({ where: { email: normalized } });
        case 'ADMINISTRATOR':
            return prisma.administrator.findUnique({ where: { email: normalized } });
    }
};

export const loginAction = async (params: ILoginRequest): Promise<ILoginResponse> => {
    const start = Date.now();
    const { email, password, stakeholder } = params;
    const h = await headers();
    const ip = getClientIP(h);
    const userAgent = h.get('user-agent') ?? '';

    // Rate limiting
    const rateLimitResult = await consumeRateLimit(ip, RATE_LIMIT_AUTH);
    if (!rateLimitResult.allowed) {
        await createDebugLog({ method: 'POST', url: '/auth/login', requestBody: { email, stakeholder }, responseBody: { error: 'Rate limited' }, status: 429, duration: Date.now() - start, stakeholder });
        return { success: false, error: 'Too many login attempts. Please try again later.' };
    }

    // Validation
    if (!email || !password || !stakeholder) {
        await createDebugLog({ method: 'POST', url: '/auth/login', requestBody: { email, stakeholder }, responseBody: { error: 'Validation failed' }, status: 400, duration: Date.now() - start, stakeholder });
        return { success: false, error: 'Email, password, and stakeholder are required' };
    }

    try {
        const entity = await getEntityByEmail(email, stakeholder);
        if (!entity || !(await verifyPassword(password, entity.password))) {
            await createDebugLog({ method: 'POST', url: '/auth/login', requestBody: { email, stakeholder }, responseBody: { error: 'Invalid credentials' }, status: 401, duration: Date.now() - start, stakeholder });
            return { success: false, error: 'Invalid email or password' };
        }
        if (!entity.isActive) {
            await createDebugLog({ method: 'POST', url: '/auth/login', requestBody: { email, stakeholder }, responseBody: { error: 'Account deactivated' }, status: 403, duration: Date.now() - start, stakeholder, stakeholderId: entity.id });
            return { success: false, error: 'Account is deactivated' };
        }

        // Create session using email as key
        const { session, limitExceeded, activeSessions } = await createSession(entity.email, stakeholder, detectDevice(userAgent), ip, userAgent);

        if (limitExceeded) {
            await createDebugLog({ method: 'POST', url: '/auth/login', requestBody: { email, stakeholder }, responseBody: { error: 'Session limit exceeded', activeSessions: activeSessions.length }, status: 409, duration: Date.now() - start, stakeholder, stakeholderId: entity.id });
            return { success: false, error: 'Session limit exceeded. Please logout from another device.', data: { user: { id: entity.id, fullName: entity.fullName, email: entity.email, avatarLink: entity.avatarLink ?? undefined }, sessionLimitExceeded: true, activeSessions } };
        }

        // Include email in JWT for session operations
        const token = await signJWT({ userId: entity.id, email: entity.email, fullName: entity.fullName, avatarLink: entity.avatarLink ?? undefined, role: stakeholder, sessionId: session.sessionId });

        const c = await cookies();
        c.set(AUTH_COOKIE[stakeholder], token, COOKIE_CONFIG);

        await createDebugLog({ method: 'POST', url: '/auth/login', requestBody: { email, stakeholder }, responseBody: { success: true, userId: entity.id }, status: 200, duration: Date.now() - start, stakeholder, stakeholderId: entity.id });
        return { success: true, data: { user: { id: entity.id, fullName: entity.fullName, email: entity.email, avatarLink: entity.avatarLink ?? undefined } } };
    } catch (error) {
        console.error('[loginAction]', error);
        await createDebugLog({ method: 'POST', url: '/auth/login', requestBody: { email, stakeholder }, responseBody: { error: 'Server error' }, status: 500, duration: Date.now() - start, stakeholder, errorMessage: error instanceof Error ? error.message : 'Unknown' });
        return { success: false, error: 'An unexpected error occurred' };
    }
};

// =============================================
// Logout Action
// =============================================

interface ILogoutRequest {
    stakeholder: StakeholderType;
}

interface ILogoutResponse {
    success: boolean;
    error?: string;
    message?: string;
}

export const logoutAction = async (params: ILogoutRequest): Promise<ILogoutResponse> => {
    const start = Date.now();
    const { stakeholder } = params;

    if (!stakeholder) return { success: false, error: 'Stakeholder is required' };

    try {
        const cookieName = AUTH_COOKIE[stakeholder];
        const c = await cookies();
        const token = c.get(cookieName)?.value;

        if (token) {
            const payload = await verifyJWT(token);
            // Use email from JWT for session invalidation
            if (payload) await invalidateSession(payload.sessionId, payload.email, payload.role);
        }

        c.delete(cookieName);
        await createDebugLog({ method: 'POST', url: '/auth/logout', requestBody: { stakeholder }, responseBody: { success: true }, status: 200, duration: Date.now() - start, stakeholder });
        return { success: true, message: 'Logged out successfully' };
    } catch (error) {
        console.error('[logoutAction]', error);
        await createDebugLog({ method: 'POST', url: '/auth/logout', requestBody: { stakeholder }, responseBody: { error: 'Server error' }, status: 500, duration: Date.now() - start, stakeholder, errorMessage: error instanceof Error ? error.message : 'Unknown' });
        return { success: false, error: 'An unexpected error occurred' };
    }
};

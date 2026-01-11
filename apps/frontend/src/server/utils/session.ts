// =============================================
// Session Service - Redis-based session management
// =============================================

import { randomUUID } from 'crypto';

import { SESSION_LIMIT, SESSION_TTL } from '@/constants/auth.constants';
import { IS_DEVELOPMENT } from '@/env';
import { type ISession } from '@/lib/interfaces/auth.interfaces';
import { getRedis } from '@/server/db/redis';
import { type DeviceType, type StakeholderType } from '@/types/auth.types';

// Redis key builders - Using email for better traceability
const sessionKey = (role: StakeholderType, email: string, sessionId: string): string => `session:${role}:${email}:${sessionId}`;
const sessionPattern = (role: StakeholderType, email: string): string => `session:${role}:${email}:*`;

// Get keys matching pattern - uses KEYS command for reliability
// Note: KEYS is blocking but acceptable for session management with limited keys per user
const getMatchingKeys = async (pattern: string): Promise<Array<string>> => {
    const redis = await getRedis();
    try {
        const keys = await redis.keys(pattern);
        logSession(`KEYS lookup: ${pattern} -> ${keys.length} found`, '', 'USER');
        return keys;
    } catch (error) {
        console.error('[Session] Failed to get keys:', error);
        return [];
    }
};

// Debug log helper
const logSession = (action: string, email: string, role: StakeholderType, sessionId?: string): void => {
    if (!IS_DEVELOPMENT) return;
    const id = sessionId ? ` [${sessionId.slice(0, 8)}...]` : '';
    console.debug(`[Session] ${action} - ${role}:${email}${id}`);
};

// createSession: Create new session, enforces SESSION_LIMIT
export const createSession = async (
    email: string,
    role: StakeholderType,
    device: DeviceType,
    ip: string,
    userAgent: string,
    location?: string
): Promise<{ session: ISession; limitExceeded: boolean; activeSessions: Array<ISession> }> => {
    const redis = await getRedis();
    const activeSessions = await getActiveSessions(email, role);
    const limitExceeded = activeSessions.length >= SESSION_LIMIT[role];

    const now = new Date();
    const session: ISession = {
        sessionId: randomUUID(),
        email,
        role,
        device,
        ip,
        location,
        userAgent,
        loginAt: now.toISOString(),
        lastActiveAt: now.toISOString(),
    };

    if (limitExceeded) {
        logSession('CREATE_BLOCKED (limit exceeded)', email, role, session.sessionId);
        return { session, limitExceeded, activeSessions };
    }

    await redis.setEx(sessionKey(role, email, session.sessionId), SESSION_TTL, JSON.stringify(session));
    logSession('CREATE', email, role, session.sessionId);

    return { session, limitExceeded, activeSessions };
};

// getActiveSessions: Get all active sessions for user using KEYS + MGET
export const getActiveSessions = async (email: string, role: StakeholderType): Promise<Array<ISession>> => {
    const redis = await getRedis();
    const keys = await getMatchingKeys(sessionPattern(role, email));
    if (keys.length === 0) return [];

    const values = await redis.mGet(keys);
    const sessions = values.filter((data): data is string => data !== null).map((data) => JSON.parse(data) as ISession);

    return sessions.sort((a, b) => new Date(b.loginAt).getTime() - new Date(a.loginAt).getTime());
};

// validateSession: Check if session exists and is active
export const validateSession = async (sessionId: string, email: string, role: StakeholderType): Promise<boolean> => {
    const redis = await getRedis();
    const exists = (await redis.exists(sessionKey(role, email, sessionId))) === 1;
    logSession(exists ? 'VALIDATE_OK' : 'VALIDATE_FAIL', email, role, sessionId);
    return exists;
};

// invalidateSession: Delete specific session
export const invalidateSession = async (sessionId: string, email: string, role: StakeholderType): Promise<void> => {
    const redis = await getRedis();
    await redis.del(sessionKey(role, email, sessionId));
    logSession('INVALIDATE', email, role, sessionId);
};

// updateSessionActivity: Refresh session TTL
export const updateSessionActivity = async (sessionId: string, email: string, role: StakeholderType): Promise<void> => {
    const redis = await getRedis();
    await redis.expire(sessionKey(role, email, sessionId), SESSION_TTL);
};

// invalidateAllSessions: Logout everywhere
export const invalidateAllSessions = async (email: string, role: StakeholderType): Promise<void> => {
    const redis = await getRedis();
    const keys = await getMatchingKeys(sessionPattern(role, email));
    if (keys.length > 0) {
        await redis.del(keys);
        logSession(`INVALIDATE_ALL (${keys.length} sessions)`, email, role);
    }
};

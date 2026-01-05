// =============================================
// Session Service - Redis-based session management using SCAB pattern for lookups
// =============================================

import { randomUUID } from 'crypto';

import { type DeviceType, type StakeholderType, SESSION_LIMIT, SESSION_TTL } from '@/constants/auth.constants.js';
import { getRedis } from '../db/index.js';
import { type ISession } from '@/lib/interfaces/auth.interfaces.js';

// Redis key builders
const sessionKey = (role: StakeholderType, userId: string, sessionId: string): string => `session:${role}:${userId}:${sessionId}`;
const sessionPattern = (role: StakeholderType, userId: string): string => `session:${role}:${userId}:*`;

// Scan for keys matching pattern (non-blocking, production-safe)
const scanKeys = async (pattern: string): Promise<Array<string>> => {
    const redis = getRedis();
    const keys: Array<string> = [];
    for await (const key of redis.scanIterator({ MATCH: pattern, COUNT: 100 })) {
        if (typeof key === 'string') {
            keys.push(key);
        }
    }
    return keys;
};

// Create new session, returns conflict info if limit exceeded
export const createSession = async (
    userId: string,
    role: StakeholderType,
    device: DeviceType,
    ip: string,
    userAgent: string,
    location: string | null = null,
): Promise<{ session: ISession; limitExceeded: boolean; activeSessions: Array<ISession> }> => {
    const redis = getRedis();
    const activeSessions = await getActiveSessions(userId, role);
    const limitExceeded = activeSessions.length >= SESSION_LIMIT[role];

    const session: ISession = {
        sessionId: randomUUID(),
        userId,
        role,
        device,
        ip,
        location,
        userAgent,
        createdAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
    };

    // Only store session if limit is not exceeded
    if (!limitExceeded) {
        await redis.setEx(sessionKey(role, userId, session.sessionId), SESSION_TTL, JSON.stringify(session));
    }

    return { session, limitExceeded, activeSessions };
};

// Get all active sessions for user using SCAN + MGET
export const getActiveSessions = async (userId: string, role: StakeholderType): Promise<Array<ISession>> => {
    const redis = getRedis();
    const keys = await scanKeys(sessionPattern(role, userId));

    if (keys.length === 0) return [];

    // Use MGET for batch retrieval (single round-trip)
    const values = await redis.mGet(keys);

    const sessions = values
        .filter((data): data is string => data !== null)
        .map((data) => JSON.parse(data) as ISession);

    return sessions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

// Validate session exists and is active
export const validateSession = async (sessionId: string, userId: string, role: StakeholderType): Promise<boolean> => {
    const redis = getRedis();
    return (await redis.exists(sessionKey(role, userId, sessionId))) === 1;
};

// Invalidate specific session
export const invalidateSession = async (sessionId: string, userId: string, role: StakeholderType): Promise<void> => {
    const redis = getRedis();
    await redis.del(sessionKey(role, userId, sessionId));
};

// Update session TTL (refresh expiry without reading/writing full data)
export const updateSessionActivity = async (sessionId: string, userId: string, role: StakeholderType): Promise<void> => {
    const redis = getRedis();
    await redis.expire(sessionKey(role, userId, sessionId), SESSION_TTL);
};

// Invalidate all sessions for user (logout everywhere)
export const invalidateAllSessions = async (userId: string, role: StakeholderType): Promise<void> => {
    const redis = getRedis();
    const keys = await scanKeys(sessionPattern(role, userId));

    if (keys.length > 0) {
        await redis.del(keys);
    }
};

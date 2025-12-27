// =============================================
// Session Service - Redis-based session management using SCAB pattern for lookups
// =============================================

import { randomUUID } from 'crypto';

import { SESSION_LIMIT, SESSION_TTL, type ISession, type StakeholderType, type DeviceType } from 'sakalsense-core';

import { getRedis } from '../db/index.js';

// Redis key builders
const sessionKey = (role: StakeholderType, userId: string, sessionId: string): string => `session:${role}:${userId}:${sessionId}`;
const sessionPattern = (role: StakeholderType, userId: string): string => `session:${role}:${userId}:*`;

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

// Get all active sessions for user using SCAN
export const getActiveSessions = async (userId: string, role: StakeholderType): Promise<Array<ISession>> => {
    const redis = getRedis();
    const keys = await redis.keys(sessionPattern(role, userId));

    if (keys.length === 0) return [];

    const sessions = await Promise.all(
        keys.map(async (key) => {
            const data = await redis.get(key);
            return data && typeof data === 'string' ? (JSON.parse(data) as ISession) : null;
        }),
    );

    return sessions.filter((s): s is ISession => s !== null).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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
    // Single EXPIRE command - much faster than GET + parse + SET
    await redis.expire(sessionKey(role, userId, sessionId), SESSION_TTL);
};

// Invalidate all sessions for user (logout everywhere)
export const invalidateAllSessions = async (userId: string, role: StakeholderType): Promise<void> => {
    const redis = getRedis();
    const keys = await redis.keys(sessionPattern(role, userId));

    if (keys.length > 0) {
        await redis.del(keys);
    }
};

// =============================================
// Rate Limit Service - Sliding window with Redis Sorted Sets
// =============================================

import { getRedis } from '@/db/index.js';
import { RATE_LIMIT_KEY_PREFIX } from '@/constants/rateLimit.constants.js';

// Types
export interface IRateLimitResult {
    allowed: boolean;
    remaining: number;
    resetAt: number;
    retryAfter?: number;
}

export interface IRateLimitConfig {
    windowMs: number;
    maxRequests: number;
}

// Redis key builder
const buildKey = (id: string): string => `${RATE_LIMIT_KEY_PREFIX}:${id}`;

// Consume rate limit - check and record request atomically
export const consumeRateLimit = async (id: string, { windowMs, maxRequests }: IRateLimitConfig): Promise<IRateLimitResult> => {
    const redis = getRedis();
    const key = buildKey(id);
    const now = Date.now();
    const requestId = `${now}:${Math.random().toString(36).slice(2, 8)}`;

    // Pipeline: cleanup expired -> count -> add new -> set TTL
    const multi = redis.multi();
    multi.zRemRangeByScore(key, 0, now - windowMs);
    multi.zCard(key);
    multi.zAdd(key, { score: now, value: requestId });
    multi.expire(key, Math.ceil(windowMs / 1000));

    const results = await multi.exec();
    const count = typeof results?.[1] === 'number' ? results[1] : 0;
    const resetAt = now + windowMs;

    // Over limit: rollback and reject
    if (count >= maxRequests) {
        await redis.zRem(key, requestId);
        const oldest = await redis.zRangeWithScores(key, 0, 0);
        const retryAfter = Math.max(1, Math.ceil(((oldest[0]?.score ?? now) + windowMs - now) / 1000));
        return { allowed: false, remaining: 0, resetAt, retryAfter };
    }

    return { allowed: true, remaining: maxRequests - count - 1, resetAt };
};

// Check rate limit without consuming (read-only)
export const checkRateLimit = async (id: string, { windowMs, maxRequests }: IRateLimitConfig): Promise<IRateLimitResult> => {
    const redis = getRedis();
    const key = buildKey(id);
    const now = Date.now();

    await redis.zRemRangeByScore(key, 0, now - windowMs);
    const count = await redis.zCard(key);
    const resetAt = now + windowMs;

    if (count >= maxRequests) {
        const oldest = await redis.zRangeWithScores(key, 0, 0);
        const retryAfter = Math.max(1, Math.ceil(((oldest[0]?.score ?? now) + windowMs - now) / 1000));
        return { allowed: false, remaining: 0, resetAt, retryAfter };
    }

    return { allowed: true, remaining: maxRequests - count, resetAt };
};

// Reset rate limit for identifier (admin use)
export const resetRateLimit = async (id: string): Promise<void> => {
    await getRedis().del(buildKey(id));
};

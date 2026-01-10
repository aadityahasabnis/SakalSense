// =============================================
// Rate Limit Service - Sliding window algorithm with Redis Sorted Sets
// =============================================

import { type IRateLimitConfig, RATE_LIMIT_KEY_PREFIX } from '@/constants/rate-limit.constants';
import { getRedis } from '@/server/db/redis';

// Rate limit result
export interface IRateLimitResult {
    allowed: boolean;
    remaining: number;
    resetAt: number;
    retryAfter?: number;
}

// Sanitize identifier to prevent nested folders in Redis
const sanitizeId = (id: string): string => id.replace(/[:/\\]/g, '_').toLowerCase();

// Build Redis key
const buildKey = (identifier: string): string => `${RATE_LIMIT_KEY_PREFIX}:${sanitizeId(identifier)}`;

// consumeRateLimit: Check and consume a request from the rate limit
export const consumeRateLimit = async (identifier: string, config: IRateLimitConfig): Promise<IRateLimitResult> => {
    const redis = await getRedis();
    const key = buildKey(identifier);
    const now = Date.now();
    const windowStart = now - config.windowMs;
    const requestId = `${now}_${Math.random().toString(36).slice(2, 6)}`;

    // Atomic pipeline: cleanup → count → add → expire
    const pipeline = redis.multi();
    pipeline.zRemRangeByScore(key, 0, windowStart);
    pipeline.zCard(key);
    pipeline.zAdd(key, { score: now, value: requestId });
    pipeline.expire(key, Math.ceil(config.windowMs / 1000));

    const results = await pipeline.exec();
    const currentCount = typeof results?.[1] === 'number' ? results[1] : 0;
    const resetAt = now + config.windowMs;

    // Over limit: rollback the added request
    if (currentCount >= config.maxRequests) {
        await redis.zRem(key, requestId);
        const oldest = await redis.zRangeWithScores(key, 0, 0);
        const oldestTime = oldest[0]?.score ?? now;
        const retryAfter = Math.max(1, Math.ceil((oldestTime + config.windowMs - now) / 1000));
        return { allowed: false, remaining: 0, resetAt, retryAfter };
    }

    return { allowed: true, remaining: config.maxRequests - currentCount - 1, resetAt };
};

// checkRateLimit: Check without consuming (read-only)
export const checkRateLimit = async (identifier: string, config: IRateLimitConfig): Promise<IRateLimitResult> => {
    const redis = await getRedis();
    const key = buildKey(identifier);
    const now = Date.now();

    await redis.zRemRangeByScore(key, 0, now - config.windowMs);
    const count = await redis.zCard(key);
    const resetAt = now + config.windowMs;

    if (count >= config.maxRequests) {
        const oldest = await redis.zRangeWithScores(key, 0, 0);
        const retryAfter = Math.max(1, Math.ceil(((oldest[0]?.score ?? now) + config.windowMs - now) / 1000));
        return { allowed: false, remaining: 0, resetAt, retryAfter };
    }

    return { allowed: true, remaining: config.maxRequests - count, resetAt };
};

// resetRateLimit: Clear rate limit for identifier
export const resetRateLimit = async (identifier: string): Promise<void> => {
    const redis = await getRedis();
    await redis.del(buildKey(identifier));
};

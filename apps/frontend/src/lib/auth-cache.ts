// =============================================
// Auth Cache - Redis caching for authentication data
// =============================================

import { getRedis } from '@/server/db/redis';
import { type ICurrentUser } from '@/lib/auth';

/**
 * Cache duration for auth data (60 seconds)
 * Short TTL to balance performance and freshness
 */
const AUTH_CACHE_TTL = 60;

/**
 * Generate cache key for user auth data
 */
const getUserCacheKey = (stakeholder: string, userId: string): string => 
    `auth:${stakeholder}:${userId}`;

/**
 * Get cached user data
 * Returns null if not found or cache miss
 */
export const getCachedUser = async (
    stakeholder: string,
    userId: string
): Promise<ICurrentUser | null> => {
    try {
        const redis = await getRedis();
        const key = getUserCacheKey(stakeholder, userId);
        const cached = await redis.get(key);
        
        if (!cached) return null;
        
        return JSON.parse(cached) as ICurrentUser;
    } catch (error) {
        console.error('[Auth Cache] Get error:', error);
        return null; // Fail silently, fall back to database
    }
};

/**
 * Cache user data
 * Sets with TTL of 60 seconds
 */
export const setCachedUser = async (
    stakeholder: string,
    userId: string,
    userData: ICurrentUser
): Promise<void> => {
    try {
        const redis = await getRedis();
        const key = getUserCacheKey(stakeholder, userId);
        await redis.setEx(key, AUTH_CACHE_TTL, JSON.stringify(userData));
    } catch (error) {
        console.error('[Auth Cache] Set error:', error);
        // Fail silently, don't block the auth flow
    }
};

/**
 * Invalidate user cache
 * Call this when user data changes (logout, profile update, etc.)
 */
export const invalidateUserCache = async (
    stakeholder: string,
    userId: string
): Promise<void> => {
    try {
        const redis = await getRedis();
        const key = getUserCacheKey(stakeholder, userId);
        await redis.del(key);
    } catch (error) {
        console.error('[Auth Cache] Invalidate error:', error);
    }
};

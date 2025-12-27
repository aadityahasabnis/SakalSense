// =============================================
// Redis Connection Handler
// =============================================

import { createClient, type RedisClientType } from 'redis';

import { REDIS_HOST, REDIS_PORT, REDIS_USERNAME, REDIS_PASSWORD } from '../config/index.js';

// redis: Singleton Redis client instance, initialized lazily
let redis: RedisClientType | null = null;

// connectRedis: Creates and connects Redis client with credentials
export const connectRedis = async (): Promise<RedisClientType> => {
    if (redis) return redis;

    redis = createClient({
        username: REDIS_USERNAME,
        password: REDIS_PASSWORD,
        socket: { host: REDIS_HOST, port: REDIS_PORT },
    });

    redis.on('connect', () => console.log('[Redis] Connected'));
    redis.on('error', (err) => console.error('[Redis] Error:', err.message));

    await redis.connect();
    return redis;
};

// getRedis: Returns Redis client instance, throws if not initialized
export const getRedis = (): RedisClientType => {
    if (!redis) throw new Error('Redis not initialized. Call connectRedis() first.');
    return redis;
};

// isRedisConnected: Health check utility
export const isRedisConnected = (): boolean => redis?.isReady ?? false;

// disconnectRedis: Graceful shutdown
export const disconnectRedis = async (): Promise<void> => {
    if (redis) await redis.quit();
};

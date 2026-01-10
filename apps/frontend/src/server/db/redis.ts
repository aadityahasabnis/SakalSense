// =============================================
// Redis Client - Singleton for sessions, caching, rate limiting
// =============================================

import { createClient, type RedisClientType } from 'redis';

import { REDIS_HOST, REDIS_PASSWORD, REDIS_PORT, REDIS_USERNAME } from '@/env';

let redis: RedisClientType | undefined;
let connectionPromise: Promise<RedisClientType> | undefined;

// getRedis: Get or create Redis client singleton
export const getRedis = async (): Promise<RedisClientType> => {
    if (redis?.isReady) return redis;
    if (connectionPromise) return connectionPromise;

    connectionPromise = (async () => {
        redis = createClient({
            username: REDIS_USERNAME,
            password: REDIS_PASSWORD,
            socket: { host: REDIS_HOST, port: REDIS_PORT },
        });

        redis.on('error', (err) => console.error('[Redis] Error:', err.message));
        redis.on('connect', () => console.log('[Redis] Connected'));

        await redis.connect();
        return redis;
    })();

    return connectionPromise;
};

// isRedisConnected: Health check utility
export const isRedisConnected = (): boolean => redis?.isReady ?? false;

// disconnectRedis: Graceful shutdown
export const disconnectRedis = async (): Promise<void> => {
    if (redis) {
        await redis.quit();
        redis = undefined;
        connectionPromise = undefined;
    }
};

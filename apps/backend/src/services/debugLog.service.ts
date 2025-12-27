// =============================================
// Debug Log Service - Redis-based API request/response logging
// =============================================

import { DEBUG_LOG_TTL, DEBUG_LOG_KEY_PREFIX, formatDate, type IDebugLogEntry } from 'sakalsense-core';

import { getRedis } from '../db';

// Generate time-sortable ID (timestamp + random suffix)
const generateId = (): string => {
    const date = formatDate(new Date(), { includeYear: true, includeTime: true, includeSeconds: true });
    const random = Math.random().toString(36).substring(2, 4);
    return `${date}_${random}`;
};

// Build Redis key with date prefix for efficient querying
const buildLogKey = (id: string): string => {
    const date = formatDate(new Date(), { includeYear: true });
    return `${DEBUG_LOG_KEY_PREFIX}:${date}:${id}`;
};

// Create and store debug log entry
export const createDebugLog = async (entry: Omit<IDebugLogEntry, 'id'>): Promise<void> => {
    try {
        const redis = getRedis();
        const id = generateId();
        const logEntry: IDebugLogEntry = { id, ...entry };
        const key = buildLogKey(id);

        await redis.setEx(key, DEBUG_LOG_TTL, JSON.stringify(logEntry));
    } catch (error) {
        console.error('[DebugLog] Failed to write log:', error);
    }
};

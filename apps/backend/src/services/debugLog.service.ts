// =============================================
// Debug Log Service - Redis-based API request/response logging
// =============================================

import { type IDebugLogEntry } from '@/lib/interfaces/debugLog.interfaces.js';

import { getRedis } from '../db/index.js';
import { formatDate } from '@/utils/date.utils.js';
import { DEBUG_LOG_KEY_PREFIX, DEBUG_LOG_TTL } from '@/constants/http.constants.js';

// Generate time-sortable ID (timestamp + random suffix)
const generateId = (): string => {
    const now = new Date();
    const timestamp = now.getTime(); // Unix timestamp for sortability
    const random = Math.random().toString(36).substring(2, 6);
    return `${timestamp}_${random}`;
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

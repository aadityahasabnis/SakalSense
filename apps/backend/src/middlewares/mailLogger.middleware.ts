// =============================================
// Mail Logger Middleware - Auto-logs all emails to Redis with optimized stats
// =============================================

import { getRedis } from '@/db/index.js';
import { EMAIL_LOG_TTL, EMAIL_LOG_KEY_PREFIX } from '@/constants/email.constants.js';
import { type IEmailLogEntry } from '@/lib/interfaces/email.interfaces.js';
import { formatDate } from '@/utils/date.utils.js';
import { generateEmailId, buildEmailLogKey } from '@/utils/mail.utils.js';

// Stats counter keys
const STATS_KEY = {
    SENT: `${EMAIL_LOG_KEY_PREFIX}:stats:sent`,
    FAILED: `${EMAIL_LOG_KEY_PREFIX}:stats:failed`,
    TOTAL: `${EMAIL_LOG_KEY_PREFIX}:stats:total`,
} as const;

// createMailLog: Store email log entry in Redis with 7-day TTL
export const createMailLog = async (entry: Omit<IEmailLogEntry, 'id' | 'timestamp'>): Promise<void> => {
    try {
        const redis = getRedis();
        const id = generateEmailId();
        const timestamp = formatDate(new Date(), { includeTime: true, includeSeconds: true });

        const logEntry: IEmailLogEntry = { id, timestamp, ...entry };
        const key = buildEmailLogKey(entry.status, id);

        // Use pipeline for atomic operations
        const pipeline = redis.multi();
        pipeline.setEx(key, EMAIL_LOG_TTL, JSON.stringify(logEntry));
        pipeline.incr(STATS_KEY.TOTAL);
        pipeline.incr(entry.status === 'SENT' ? STATS_KEY.SENT : STATS_KEY.FAILED);
        await pipeline.exec();
    } catch (error) {
        console.error('[MailLog] Failed to write log:', error);
    }
};

// Scan for keys matching pattern (non-blocking)
const scanKeys = async (pattern: string, limit?: number): Promise<Array<string>> => {
    const redis = getRedis();
    const keys: Array<string> = [];
    for await (const key of redis.scanIterator({ MATCH: pattern, COUNT: 100 })) {
        if (typeof key === 'string') {
            keys.push(key);
            if (limit && keys.length >= limit) break;
        }
    }
    return keys;
};

// getMailLogsByRecipient: Retrieve all email logs for a specific recipient
export const getMailLogsByRecipient = async (recipientEmail: string): Promise<Array<IEmailLogEntry>> => {
    try {
        const redis = getRedis();
        const sanitizedEmail = recipientEmail.toLowerCase().replace(/[^a-z0-9@._-]/g, '');
        const pattern = `${EMAIL_LOG_KEY_PREFIX}:*:*:*`;
        const keys = await scanKeys(pattern, 200);

        if (keys.length === 0) return [];

        // Batch get with MGET
        const values = await redis.mGet(keys);
        const logs: Array<IEmailLogEntry> = [];

        for (const data of values) {
            if (data && typeof data === 'string') {
                const log = JSON.parse(data) as IEmailLogEntry;
                if (log.recipient.toLowerCase() === sanitizedEmail) {
                    logs.push(log);
                }
            }
        }

        return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (error) {
        console.error('[MailLog] Failed to read logs:', error);
        return [];
    }
};

// getRecentMailLogs: Get recent email logs with limit
export const getRecentMailLogs = async (limit: number = 50): Promise<Array<IEmailLogEntry>> => {
    try {
        const redis = getRedis();
        const pattern = `${EMAIL_LOG_KEY_PREFIX}:*`;
        const keys = await scanKeys(pattern, limit * 2);

        if (keys.length === 0) return [];

        // Batch get with MGET
        const values = await redis.mGet(keys);
        const logs: Array<IEmailLogEntry> = values
            .filter((data): data is string => data !== null)
            .map((data) => JSON.parse(data) as IEmailLogEntry);

        return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, limit);
    } catch (error) {
        console.error('[MailLog] Failed to read logs:', error);
        return [];
    }
};

// getMailLogStats: Get email statistics using counters (O(1) instead of O(N))
export const getMailLogStats = async (): Promise<{ total: number; sent: number; failed: number }> => {
    try {
        const redis = getRedis();

        // Use MGET for single round-trip
        const values = await redis.mGet([STATS_KEY.TOTAL, STATS_KEY.SENT, STATS_KEY.FAILED]);

        return {
            total: parseInt((values[0] as string | null) ?? '0', 10),
            sent: parseInt((values[1] as string | null) ?? '0', 10),
            failed: parseInt((values[2] as string | null) ?? '0', 10),
        };
    } catch (error) {
        console.error('[MailLog] Failed to get stats:', error);
        return { total: 0, sent: 0, failed: 0 };
    }
};

// resetMailLogStats: Reset all stats counters (admin use)
export const resetMailLogStats = async (): Promise<void> => {
    const redis = getRedis();
    await redis.del([STATS_KEY.TOTAL, STATS_KEY.SENT, STATS_KEY.FAILED]);
};

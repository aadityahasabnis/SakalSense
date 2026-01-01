// =============================================
// Mail Logger Middleware - Auto-logs all emails to Redis
// =============================================

import { getRedis } from '@/db/index.js';
import { EMAIL_LOG_TTL, EMAIL_LOG_KEY_PREFIX } from '@/constants/email.constants.js';
import { type IEmailLogEntry } from '@/lib/interfaces/email.interfaces.js';
import { formatDate } from '@/utils/date.utils.js';
import { generateEmailId, buildEmailLogKey, sanitizeEmailAddress } from '@/utils/mail.utils.js';

// createMailLog: Store email log entry in Redis with 7-day TTL
// Key format: maillog:STATUS:date:id (organized by status for easy querying)
export const createMailLog = async (entry: Omit<IEmailLogEntry, 'id' | 'timestamp'>): Promise<void> => {
    try {
        const redis = getRedis();
        const id = generateEmailId();
        const timestamp = formatDate(new Date(), { includeTime: true, includeSeconds: true });

        const logEntry: IEmailLogEntry = {
            id,
            timestamp,
            ...entry,
        };

        // Key structure: maillog:SENT:1 Jan 2026:id or maillog:FAILED:1 Jan 2026:id
        const key = buildEmailLogKey(entry.status, id);
        await redis.setEx(key, EMAIL_LOG_TTL, JSON.stringify(logEntry));
    } catch (error) {
        console.error('[MailLog] Failed to write log:', error);
    }
};

// getMailLogsByRecipient: Retrieve all email logs for a specific recipient
export const getMailLogsByRecipient = async (recipientEmail: string): Promise<Array<IEmailLogEntry>> => {
    try {
        const redis = getRedis();
        const sanitizedEmail = sanitizeEmailAddress(recipientEmail);
        const pattern = `${EMAIL_LOG_KEY_PREFIX}:${sanitizedEmail}:*`;
        const keys = await redis.keys(pattern);

        if (keys.length === 0) return [];

        const logs: Array<IEmailLogEntry> = [];
        for (const key of keys) {
            const data = await redis.get(key);
            if (data) {
                logs.push(JSON.parse(data) as IEmailLogEntry);
            }
        }

        // Sort by timestamp descending (newest first)
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
        const keys = await redis.keys(pattern);

        if (keys.length === 0) return [];

        const logs: Array<IEmailLogEntry> = [];
        for (const key of keys.slice(0, limit * 2)) {
            const data = await redis.get(key);
            if (data) {
                logs.push(JSON.parse(data) as IEmailLogEntry);
            }
        }

        // Sort and limit
        return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, limit);
    } catch (error) {
        console.error('[MailLog] Failed to read logs:', error);
        return [];
    }
};

// getMailLogStats: Get email statistics
export const getMailLogStats = async (): Promise<{ total: number; sent: number; failed: number }> => {
    try {
        const redis = getRedis();
        const pattern = `${EMAIL_LOG_KEY_PREFIX}:*`;
        const keys = await redis.keys(pattern);

        let sent = 0;
        let failed = 0;

        for (const key of keys) {
            const data = await redis.get(key);
            if (data) {
                const log = JSON.parse(data) as IEmailLogEntry;
                if (log.status === 'SENT') sent++;
                else if (log.status === 'FAILED') failed++;
            }
        }

        return { total: keys.length, sent, failed };
    } catch (error) {
        console.error('[MailLog] Failed to get stats:', error);
        return { total: 0, sent: 0, failed: 0 };
    }
};

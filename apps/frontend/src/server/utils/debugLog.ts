'use server';
// =============================================
// Debug Log Utility - Redis-based request/response logging
// =============================================

import { randomUUID } from 'crypto';

import { IS_DEVELOPMENT } from '@/env';
import { type DebugLogStatusCategory, type IDebugLogEntry } from '@/lib/interfaces/debugLog.interfaces';
import { getRedis } from '@/server/db/redis';
import { type StakeholderType } from '@/types/auth.types';

// Redis key configuration
const DEBUG_LOG_PREFIX = 'authlog';
const DEBUG_LOG_TTL = 86400; // 24 hours

// Redis key builder
const debugLogKey = (id: string): string => `${DEBUG_LOG_PREFIX}:${id}`;
const debugLogListKey = (): string => `${DEBUG_LOG_PREFIX}:list`;

// Map HTTP status to category
const getStatusCategory = (status: number): DebugLogStatusCategory => {
    if (status >= 200 && status < 300) return 'SUCCESS';
    if (status === 400) return 'BAD_REQUEST';
    if (status === 401) return 'UNAUTHORIZED';
    if (status === 403) return 'FORBIDDEN';
    if (status === 404) return 'NOT_FOUND';
    if (status === 409) return 'CONFLICT';
    if (status === 422) return 'VALIDATION_ERROR';
    return 'SERVER_ERROR';
};

// createDebugLog: Store auth action request/response in Redis
export const createDebugLog = async (params: {
    method: string;
    url: string;
    requestBody: unknown;
    responseBody: unknown;
    status: number;
    duration: number;
    stakeholder?: StakeholderType;
    stakeholderId?: string;
    errorMessage?: string;
}): Promise<string> => {
    const id = randomUUID();
    const timestamp = new Date().toISOString();

    const entry: IDebugLogEntry = {
        id,
        timestamp,
        method: params.method,
        url: params.url,
        requestBody: params.requestBody,
        responseBody: params.responseBody,
        status: params.status,
        duration: params.duration,
        statusCategory: getStatusCategory(params.status),
        stakeholder: params.stakeholder,
        stakeholderId: params.stakeholderId,
        errorMessage: params.errorMessage,
    };

    // Also log to console in development
    if (IS_DEVELOPMENT) {
        const statusColor = params.status >= 400 ? '\x1b[31m' : '\x1b[32m';
        console.log(`${statusColor}[AuthLog]${'\x1b[0m'} ${params.method} ${params.url} - ${params.status} (${params.duration}ms)`);
    }

    try {
        const redis = await getRedis();
        await redis.setEx(debugLogKey(id), DEBUG_LOG_TTL, JSON.stringify(entry));
        await redis.lPush(debugLogListKey(), id);
        await redis.lTrim(debugLogListKey(), 0, 999); // Keep last 1000 entries
    } catch (error) {
        console.error('[createDebugLog] Redis error:', error);
    }

    return id;
};

// getDebugLogs: Retrieve recent debug logs
export const getDebugLogs = async (limit = 50): Promise<Array<IDebugLogEntry>> => {
    try {
        const redis = await getRedis();
        const ids = await redis.lRange(debugLogListKey(), 0, limit - 1);
        if (ids.length === 0) return [];

        const logs = await redis.mGet(ids.map(debugLogKey));
        return logs.filter((log): log is string => log !== null).map((log) => JSON.parse(log) as IDebugLogEntry);
    } catch (error) {
        console.error('[getDebugLogs] Redis error:', error);
        return [];
    }
};

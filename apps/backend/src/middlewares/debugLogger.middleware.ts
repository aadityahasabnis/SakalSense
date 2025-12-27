// =============================================
// Debug Logger Middleware - Logs API requests/responses to Redis
// =============================================

import { type Request, type Response, type NextFunction, type RequestHandler } from 'express';

import { DEBUG_LOG_EXCLUDED_PATHS, AUTH_COOKIE, formatDate, type IJWTPayload, type IDebugLogEntry } from 'sakalsense-core';

import { verifyJWT } from '../services/auth.service';
import { createDebugLog } from '../services/debugLog.service';

// Sanitize request body - redact sensitive fields
const sanitizeBody = (body: unknown): unknown => {
    if (!body || typeof body !== 'object') return body;

    const sanitized = { ...body } as Record<string, unknown>;
    const sensitiveFields = ['password', 'currentPassword', 'newPassword', 'token', 'secret'];

    for (const field of sensitiveFields) {
        if (field in sanitized) {
            sanitized[field] = '[REDACTED]';
        }
    }

    return sanitized;
};

// Extract stakeholder from JWT cookies
const extractStakeholder = (req: Request): { type: IDebugLogEntry['stakeholder']; id: string | null } | null => {
    const cookies = req.cookies || {};

    for (const [_role, cookieName] of Object.entries(AUTH_COOKIE)) {
        const token = cookies[cookieName];
        if (token) {
            const payload = verifyJWT(token) as IJWTPayload | null;
            if (payload) {
                return { type: payload.role, id: payload.userId };
            }
        }
    }

    return null;
};

// Extract error message from response body
const extractErrorMessage = (body: unknown): string | null => {
    if (!body || typeof body !== 'object') return null;

    const obj = body as Record<string, unknown>;
    if ('error' in obj && typeof obj.error === 'string') return obj.error;
    if ('message' in obj && typeof obj.message === 'string') return obj.message;

    return null;
};

// Get precise status category from HTTP status code
const getStatusCategory = (status: number): IDebugLogEntry['statusCategory'] => {
    if (status >= 200 && status < 300) return 'SUCCESS';
    if (status === 400) return 'BAD_REQUEST';
    if (status === 401) return 'UNAUTHORIZED';
    if (status === 403) return 'FORBIDDEN';
    if (status === 404) return 'NOT_FOUND';
    if (status === 409) return 'CONFLICT';
    if (status === 422) return 'VALIDATION_ERROR';
    return 'SERVER_ERROR';
};

// Main debug logger middleware
export const debugLoggerMiddleware: RequestHandler = (req: Request, res: Response, next: NextFunction): void => {
    // Skip excluded paths
    if (DEBUG_LOG_EXCLUDED_PATHS.some((path) => req.path.startsWith(path))) {
        next();
        return;
    }

    const startTime = Date.now();
    const requestBody = sanitizeBody(req.body);

    // Store original json method to intercept response
    const originalJson = res.json.bind(res);
    let responseBody: unknown = null;

    res.json = (body: unknown) => {
        responseBody = body;
        return originalJson(body);
    };

    // Log on response finish
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        const stakeholder = extractStakeholder(req);
        const status = res.statusCode;
        const statusCategory = getStatusCategory(status);

        const logEntry: Omit<IDebugLogEntry, 'id'> = {
            timestamp: formatDate(new Date(), { includeTime: true, includeSeconds: true }),
            method: req.method,
            url: req.originalUrl,
            requestBody,
            responseBody: sanitizeBody(responseBody),
            status,
            duration,
            statusCategory,
        };

        // Only add stakeholder if authenticated
        if (stakeholder) {
            logEntry.stakeholder = stakeholder.type;
            if (stakeholder.id) logEntry.stakeholderId = stakeholder.id;
        }

        // Only add error message if not success
        if (statusCategory !== 'SUCCESS') {
            const errorMsg = extractErrorMessage(responseBody);
            if (errorMsg) logEntry.errorMessage = errorMsg;
        }

        // Fire and forget
        createDebugLog(logEntry);
    });

    next();
};

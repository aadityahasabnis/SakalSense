// =============================================
// Rate Limit Middleware - Factory pattern for route-level rate limiting
// =============================================

import { type Request, type Response, type NextFunction, type RequestHandler } from 'express';

import { consumeRateLimit, type IRateLimitConfig } from '@/services/rateLimit.service.js';
import {
    RATE_LIMIT_WINDOW_MS,
    RATE_LIMIT_MAX_REQUESTS,
    RATE_LIMIT_STRICT_WINDOW_MS,
    RATE_LIMIT_STRICT_MAX_REQUESTS,
    RATE_LIMIT_AUTH_WINDOW_MS,
    RATE_LIMIT_AUTH_MAX_REQUESTS,
} from '@/constants/rateLimit.constants.js';
import { HTTP_STATUS } from '@/constants/http.constants.js';
import { getClientIP } from '@/utils/device.utils.js';

// Factory: creates rate limit middleware with custom config
export const rateLimit = (config: IRateLimitConfig, keyFn: (req: Request) => string = getClientIP): RequestHandler => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const result = await consumeRateLimit(keyFn(req), config);

        // Set standard rate limit headers
        res.setHeader('X-RateLimit-Limit', config.maxRequests);
        res.setHeader('X-RateLimit-Remaining', result.remaining);
        res.setHeader('X-RateLimit-Reset', Math.ceil(result.resetAt / 1000));

        if (!result.allowed) {
            res.setHeader('Retry-After', result.retryAfter ?? 60);
            res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
                success: false,
                error: 'Too many requests. Please try again later.',
                data: { retryAfter: result.retryAfter, resetAt: new Date(result.resetAt).toISOString() },
            });
            return;
        }

        next();
    };
};

// Pre-configured middlewares
export const rateLimitStandard: RequestHandler = rateLimit({ windowMs: RATE_LIMIT_WINDOW_MS, maxRequests: RATE_LIMIT_MAX_REQUESTS });
export const rateLimitStrict: RequestHandler = rateLimit({ windowMs: RATE_LIMIT_STRICT_WINDOW_MS, maxRequests: RATE_LIMIT_STRICT_MAX_REQUESTS });
export const rateLimitAuth: RequestHandler = rateLimit({ windowMs: RATE_LIMIT_AUTH_WINDOW_MS, maxRequests: RATE_LIMIT_AUTH_MAX_REQUESTS });

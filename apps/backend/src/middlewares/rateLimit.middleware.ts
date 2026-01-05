// =============================================
// Rate Limit Middleware - Express middleware factory for route-level rate limiting
// =============================================

import { type Request, type Response, type NextFunction, type RequestHandler } from 'express';

import { consumeRateLimit, type IRateLimitConfig } from '@/services/rateLimit.service.js';
import { RATE_LIMIT_STANDARD, RATE_LIMIT_STRICT, RATE_LIMIT_AUTH } from '@/constants/rateLimit.constants.js';
import { HTTP_STATUS } from '@/constants/http.constants.js';
import { getClientIP } from '@/utils/device.utils.js';

// =============================================
// Middleware Factory
// =============================================

type KeyExtractor = (req: Request) => string;

/**
 * Creates a rate limit middleware with custom configuration
 * @param config - Rate limit configuration (windowMs, maxRequests)
 * @param keyFn - Function to extract identifier from request (default: client IP)
 */
export const rateLimit = (config: IRateLimitConfig, keyFn: KeyExtractor = getClientIP): RequestHandler => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const identifier = keyFn(req);
        const result = await consumeRateLimit(identifier, config);

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

// =============================================
// Pre-configured Middlewares
// =============================================

/** Standard rate limit: 100 req/min - general API endpoints */
export const rateLimitStandard: RequestHandler = rateLimit(RATE_LIMIT_STANDARD);

/** Strict rate limit: 10 req/min - sensitive endpoints */
export const rateLimitStrict: RequestHandler = rateLimit(RATE_LIMIT_STRICT);

/** Auth rate limit: 5 req/5min - brute-force protection for login */
export const rateLimitAuth: RequestHandler = rateLimit(RATE_LIMIT_AUTH);

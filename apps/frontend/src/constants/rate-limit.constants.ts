// =============================================
// Rate Limit Constants - Sliding window configuration
// =============================================

// Standard: 100 requests per minute (general API)
export const RATE_LIMIT_STANDARD = { windowMs: 60_000, maxRequests: 100 } as const;

// Strict: 10 requests per minute (sensitive endpoints)
export const RATE_LIMIT_STRICT = { windowMs: 60_000, maxRequests: 10 } as const;

// Auth: 5 requests per 5 minutes (brute-force protection)
export const RATE_LIMIT_AUTH = { windowMs: 300_000, maxRequests: 5 } as const;

// Redis key prefix (flat namespace)
export const RATE_LIMIT_KEY_PREFIX = 'ratelimit';

// Rate limit config type
export interface IRateLimitConfig {
    windowMs: number;
    maxRequests: number;
}

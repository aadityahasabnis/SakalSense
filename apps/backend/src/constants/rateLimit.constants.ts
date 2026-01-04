// =============================================
// Rate Limit Constants
// =============================================

// Default: 100 requests per minute
export const RATE_LIMIT_WINDOW_MS = 60_000;
export const RATE_LIMIT_MAX_REQUESTS = 100;

// Strict: 10 requests per minute (sensitive endpoints)
export const RATE_LIMIT_STRICT_WINDOW_MS = 60_000;
export const RATE_LIMIT_STRICT_MAX_REQUESTS = 10;

// Auth: 5 requests per 5 minutes (brute-force protection)
export const RATE_LIMIT_AUTH_WINDOW_MS = 300_000;
export const RATE_LIMIT_AUTH_MAX_REQUESTS = 5;

// Redis key prefix
export const RATE_LIMIT_KEY_PREFIX = 'rl';

// =============================================
// Email Constants - Configuration and defaults
// =============================================

// Email log TTL: 7 days in seconds
export const EMAIL_LOG_TTL = 604800;
export const EMAIL_LOG_KEY_PREFIX = 'maillog';

// Email status for tracking
export const EMAIL_STATUS = {
    PENDING: 'PENDING',
    SENT: 'SENT',
    FAILED: 'FAILED',
} as const;
export type EmailStatusType = (typeof EMAIL_STATUS)[keyof typeof EMAIL_STATUS];

// Email types for categorization
export const EMAIL_TYPE = {
    VERIFICATION: 'VERIFICATION',
    PASSWORD_RESET: 'PASSWORD_RESET',
    OTP: 'OTP',
    NOTIFICATION: 'NOTIFICATION',
    TEST: 'TEST',
} as const;
export type EmailType = (typeof EMAIL_TYPE)[keyof typeof EMAIL_TYPE];

// Gmail SMTP configuration
export const GMAIL_SMTP_CONFIG = {
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
} as const;

// Connection pool config for efficiency
export const EMAIL_POOL_CONFIG = {
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
} as const;

// Retry configuration with exponential backoff
export const EMAIL_RETRY_CONFIG = {
    maxAttempts: 3,
    initialDelayMs: 1000,
    backoffMultiplier: 2,
} as const;

// Gmail rate limit awareness (500 emails/day for free accounts)
export const EMAIL_RATE_LIMIT = {
    dailyLimit: 500,
    warningThreshold: 450,
} as const;

// Default sender information
export const DEFAULT_SENDER = {
    name: 'SakalSense',
    replyTo: 'aaditya.hasabnis@gmail.com',
} as const;

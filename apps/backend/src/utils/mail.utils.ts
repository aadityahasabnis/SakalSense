// =============================================
// Email Utilities - Validation and helper functions
// =============================================

import { EMAIL_LOG_KEY_PREFIX } from '@/constants/email.constants.js';
import { formatDate } from './date.utils.js';

// RFC 5322 compliant email regex
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

// validateEmail: RFC 5322 compliant email validation
export const validateEmail = (email: string): boolean => {
    if (!email || typeof email !== 'string') return false;
    if (email.length > 254) return false;
    return EMAIL_REGEX.test(email);
};

// sanitizeEmailAddress: Clean and normalize, prevent header injection
export const sanitizeEmailAddress = (email: string): string => {
    if (!email || typeof email !== 'string') return '';
    // Remove potential header injection characters
    return email.toLowerCase().trim().replace(/[\r\n]/g, '');
};

// generateEmailId: Time-sortable unique ID for email logs (no colons to avoid Redis nesting)
export const generateEmailId = (): string => {
    const now = new Date();
    const timestamp = now.getTime(); // Unix timestamp for sortability
    const random = Math.random().toString(36).substring(2, 6);
    return `${timestamp}_${random}`;
};

// buildEmailLogKey: Redis key with status and date for organized hierarchy
// Format: maillog:STATUS:date:id (e.g., maillog:SENT:1 Jan 2026:2 Jan 2026, 2:30:45 am_abc)
export const buildEmailLogKey = (status: string, id: string): string => {
    const date = formatDate(new Date(), { includeYear: true });
    return `${EMAIL_LOG_KEY_PREFIX}:${status}:${date}:${id}`;
};

// extractStatusFromKey: Extract status from Redis key
export const extractStatusFromKey = (key: string): string | undefined => {
    const parts = key.split(':');
    return parts[1];
};

// delay: Promise-based delay for retry backoff
export const delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

// =============================================
// Auth Constants - Authentication configuration
// =============================================

// Stakeholder identifiers (internal use - NEVER change these)
export const STAKEHOLDER = { USER: 'USER', ADMIN: 'ADMIN', ADMINISTRATOR: 'ADMINISTRATOR' } as const;
export type StakeholderType = (typeof STAKEHOLDER)[keyof typeof STAKEHOLDER];

// Display names (configurable)
export const STAKEHOLDER_LABELS = { USER: 'User', ADMIN: 'Admin', ADMINISTRATOR: 'Administrator' } as const;

// JWT cookie names per stakeholder
export const AUTH_COOKIE = { USER: 'UToken', ADMIN: 'AToken', ADMINISTRATOR: 'SToken' } as const;
export type AuthCookieType = (typeof AUTH_COOKIE)[keyof typeof AUTH_COOKIE];

// Max concurrent sessions per role
export const SESSION_LIMIT = { USER: 1, ADMIN: 2, ADMINISTRATOR: 2 } as const;

// Session TTL: 15 days in seconds
export const SESSION_TTL = 15 * 24 * 60 * 60;

// Device types for session tracking
export const DEVICE = { MOBILE: 'mobile', TABLET: 'tablet', LAPTOP: 'laptop', DESKTOP: 'desktop', UNKNOWN: 'unknown' } as const;
export type DeviceType = (typeof DEVICE)[keyof typeof DEVICE];

// Cookie config
export const COOKIE_CONFIG = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: SESSION_TTL * 1000, path: '/' } as const;

// Password reset token TTL: 1 hour
export const PASSWORD_RESET_TTL = 3600;

// Password reset token prefixes (role encoded in token for clean URLs)
export const RESET_TOKEN_PREFIX: Record<StakeholderType, string> = { USER: 'usr', ADMIN: 'adm', ADMINISTRATOR: 'sup' } as const;
export const PREFIX_TO_STAKEHOLDER: Record<string, StakeholderType> = { usr: 'USER', adm: 'ADMIN', sup: 'ADMINISTRATOR' } as const;

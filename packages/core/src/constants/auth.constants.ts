// =============================================
// Auth Constants - Authentication configuration
// =============================================

// Stakeholder identifiers (internal use - NEVER change these)
export const STAKEHOLDER = { USER: 'USER', ADMIN: 'ADMIN', ADMINISTRATOR: 'ADMINISTRATOR' } as const;

// Display names (configurable - change freely without breaking logic)
export const STAKEHOLDER_LABELS = { USER: 'User', ADMIN: 'Admin', ADMINISTRATOR: 'Administrator' } as const;

// JWT cookie names per stakeholder
export const AUTH_COOKIE = { USER: 'UToken', ADMIN: 'AToken', ADMINISTRATOR: 'SToken' } as const;

// Max concurrent sessions per role
export const SESSION_LIMIT = { USER: 1, ADMIN: 2, ADMINISTRATOR: 2 } as const;

// Session TTL: 15 days in seconds
export const SESSION_TTL = 15 * 24 * 60 * 60;

// Device types for session tracking
export const DEVICE = { MOBILE: 'mobile', TABLET: 'tablet', LAPTOP: 'laptop', DESKTOP: 'desktop', UNKNOWN: 'unknown' } as const;

// Cookie config - sameSite 'lax' allows cross-origin cookie setting
export const COOKIE_CONFIG = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: SESSION_TTL * 1000, path: '/' } as const;

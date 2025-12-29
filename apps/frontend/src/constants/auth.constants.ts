// =============================================
// Auth Constants - Authentication configuration (Mirror of backend)
// =============================================

// Stakeholder identifiers (internal use - NEVER change these)
export const STAKEHOLDER = { USER: 'USER', ADMIN: 'ADMIN', ADMINISTRATOR: 'ADMINISTRATOR' } as const;

// Display names (configurable - change freely without breaking logic)
export const STAKEHOLDER_LABELS = { USER: 'User', ADMIN: 'Admin', ADMINISTRATOR: 'Administrator' } as const;

// JWT cookie names per stakeholder
export const AUTH_COOKIE = { USER: 'UToken', ADMIN: 'AToken', ADMINISTRATOR: 'SToken' } as const;

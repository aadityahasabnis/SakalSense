// =============================================
// Route Segments - Single source of truth
// =============================================

export const ROUTE = {
    // Base
    API: '/api',
    HEALTH: '/health',

    // Auth
    AUTH: '/auth',
    LOGIN: '/login',
    LOGOUT: '/logout',
    REGISTER: '/register',
    SESSIONS: '/sessions',
    TERMINATE: '/terminate',
    UPDATE_PASSWORD: '/update-password',

    // Stakeholders
    USER: '/user',
    ADMIN: '/admin',
    ADMINISTRATOR: '/administrator',

    // Resources
    PROFILE: '/profile',
    ADMINS: '/admins',
    USERS: '/users',
    SYSTEM: '/system',

    // Actions
    INVITE: '/invite',
    ACTIVATE: '/activate',
    DEACTIVATE: '/deactivate',
    CONFIG: '/config',
    LOGS: '/logs',
    STATS: '/stats',
} as const;

// =============================================
// Route Builder - Clean path construction
// =============================================

export const path = (...segments: Array<string>): string => segments.join('');
export const withId =
    (base: string, suffix = '') =>
    (id: string): string =>
        `${base}/${id}${suffix}`;

// =============================================
// User Routes - USER stakeholder endpoints
// =============================================

import { path, ROUTE, withId } from './routes.constants';

// ─────────────────────────────────────────────
// Base Paths
// ─────────────────────────────────────────────

const AUTH = path(ROUTE.AUTH, ROUTE.USER);
const SESSIONS = path(AUTH, ROUTE.SESSIONS);
const PROFILE = path(ROUTE.USER, ROUTE.PROFILE);

// ─────────────────────────────────────────────
// User API Routes
// ─────────────────────────────────────────────

export const USER_API_ROUTES = {
    auth: {
        login: path(AUTH, ROUTE.LOGIN),
        register: path(AUTH, ROUTE.REGISTER),
        logout: path(AUTH, ROUTE.LOGOUT),
        sessions: SESSIONS,
        terminateSession: withId(SESSIONS, ROUTE.TERMINATE),
        updatePassword: path(AUTH, ROUTE.UPDATE_PASSWORD),
    },
    profile: {
        get: PROFILE,
        update: PROFILE,
    },
} as const;

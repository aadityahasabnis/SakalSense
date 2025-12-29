// =============================================
// Admin Routes - ADMIN stakeholder endpoints
// =============================================

import { path, ROUTE, withId } from './routes.constants.js';

// ─────────────────────────────────────────────
// Base Paths
// ─────────────────────────────────────────────

const AUTH = path(ROUTE.AUTH, ROUTE.ADMIN);
const SESSIONS = path(AUTH, ROUTE.SESSIONS);

// ─────────────────────────────────────────────
// Admin API Routes
// ─────────────────────────────────────────────

export const ADMIN_API_ROUTES = {
    auth: {
        login: path(AUTH, ROUTE.LOGIN),
        register: path(AUTH, ROUTE.REGISTER),
        logout: path(AUTH, ROUTE.LOGOUT),
        sessions: SESSIONS,
        terminateSession: withId(SESSIONS, ROUTE.TERMINATE),
        updatePassword: path(AUTH, ROUTE.UPDATE_PASSWORD),
    },
} as const;

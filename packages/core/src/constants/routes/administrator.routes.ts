// =============================================
// Administrator Routes - ADMINISTRATOR stakeholder endpoints
// =============================================

import { path, ROUTE, withId } from './routes.constants.js';

// ─────────────────────────────────────────────
// Base Paths
// ─────────────────────────────────────────────

const AUTH = path(ROUTE.AUTH, ROUTE.ADMINISTRATOR);
const SESSIONS = path(AUTH, ROUTE.SESSIONS);
const ADMINS = path(ROUTE.ADMINISTRATOR, ROUTE.ADMINS);
const USERS = path(ROUTE.ADMINISTRATOR, ROUTE.USERS);
const SYSTEM = path(ROUTE.ADMINISTRATOR, ROUTE.SYSTEM);

// ─────────────────────────────────────────────
// Administrator API Routes
// ─────────────────────────────────────────────

export const ADMINISTRATOR_API_ROUTES = {
    auth: {
        login: path(AUTH, ROUTE.LOGIN),
        logout: path(AUTH, ROUTE.LOGOUT),
        sessions: SESSIONS,
        terminateSession: withId(SESSIONS, ROUTE.TERMINATE),
        updatePassword: path(AUTH, ROUTE.UPDATE_PASSWORD),
    },
    admins: {
        list: ADMINS,
        get: withId(ADMINS),
        invite: path(ADMINS, ROUTE.INVITE),
        update: withId(ADMINS),
        delete: withId(ADMINS),
        activate: withId(ADMINS, ROUTE.ACTIVATE),
        deactivate: withId(ADMINS, ROUTE.DEACTIVATE),
    },
    users: {
        list: USERS,
        get: withId(USERS),
        delete: withId(USERS),
    },
    system: {
        config: path(SYSTEM, ROUTE.CONFIG),
        logs: path(SYSTEM, ROUTE.LOGS),
        stats: path(SYSTEM, ROUTE.STATS),
    },
} as const;

// =============================================
// Administrator Routes - ADMINISTRATOR stakeholder endpoints
// =============================================

export const ADMINISTRATOR_API_ROUTES = {
    auth: {
        login: '/auth/administrator/login',
        logout: '/auth/administrator/logout',
        sessions: '/auth/administrator/sessions',
        terminateSession: (id: string) => `/auth/administrator/sessions/terminate/${id}`,
        updatePassword: '/auth/administrator/update-password',
    },
    admins: {
        list: '/administrator/admins',
        get: (id: string) => `/administrator/admins/${id}`,
        invite: '/administrator/admins/invite',
        update: (id: string) => `/administrator/admins/${id}`,
        delete: (id: string) => `/administrator/admins/${id}`,
        activate: (id: string) => `/administrator/admins/activate/${id}`,
        deactivate: (id: string) => `/administrator/admins/deactivate/${id}`,
    },
    users: {
        list: '/administrator/users',
        get: (id: string) => `/administrator/users/${id}`,
        delete: (id: string) => `/administrator/users/${id}`,
    },
    system: {
        config: '/administrator/system/config',
        logs: '/administrator/system/logs',
        stats: '/administrator/system/stats',
    },
} as const;

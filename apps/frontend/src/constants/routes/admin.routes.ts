// =============================================
// Admin Routes - ADMIN stakeholder endpoints
// =============================================

export const ADMIN_API_ROUTES = {
    auth: {
        login: '/auth/admin/login',
        register: '/auth/admin/register',
        logout: '/auth/admin/logout',
        sessions: '/auth/admin/sessions',
        terminateSession: (id: string) => `/auth/admin/sessions/${id}/terminate`,
        updatePassword: '/auth/admin/update-password',
    },
} as const;

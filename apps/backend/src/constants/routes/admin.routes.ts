// =============================================
// Admin Routes - ADMIN stakeholder endpoints
// =============================================

export const ADMIN_API_ROUTES = {
    auth: {
        login: '/auth/admin/login',
        register: '/auth/admin/register',
        logout: '/auth/admin/logout',
        sessions: '/auth/admin/sessions',
        terminateSession: (id: string) => `/auth/admin/sessions/terminate/${id}`,
        updatePassword: '/auth/admin/update-password',
        forgotPassword: '/auth/admin/forgot-password',
        resetPassword: '/auth/admin/reset-password',
    },
} as const;

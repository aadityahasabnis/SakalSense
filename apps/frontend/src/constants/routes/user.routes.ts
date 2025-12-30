// =============================================
// User Routes - USER stakeholder endpoints
// =============================================

export const USER_API_ROUTES = {
    auth: {
        login: '/auth/user/login',
        register: '/auth/user/register',
        logout: '/auth/user/logout',
        sessions: '/auth/user/sessions',
        terminateSession: (id: string) => `/auth/user/sessions/terminate/${id}`,
        updatePassword: '/auth/user/update-password',
    },
    profile: {
        get: '/user/profile',
        update: '/user/profile',
    },
} as const;

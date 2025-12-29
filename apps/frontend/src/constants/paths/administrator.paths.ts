// Administrator UI paths - Navigation routes for ADMINISTRATOR stakeholder
// Usage: import { ADMINISTRATOR_PATHS } from '@sakalsense/core';

export const ADMINISTRATOR_PATHS = {
    login: '/administrator/login',
    dashboard: '/administrator/dashboard',
    admins: {
        all: '/administrator/admins',
        detail: (id: string) => `/administrator/admins/${id}`,
        invite: '/administrator/admins/invite',
    },
    users: {
        all: '/administrator/users',
        detail: (id: string) => `/administrator/users/${id}`,
    },
    system: {
        config: '/administrator/system/config',
        logs: '/administrator/system/logs',
    },
} as const;

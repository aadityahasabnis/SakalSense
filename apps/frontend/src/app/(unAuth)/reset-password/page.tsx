'use client';

// =============================================
// Unified Reset Password Page
// Extracts role from token prefix (usr_, adm_, sup_)
// =============================================

import { Suspense } from 'react';

import { useSearchParams } from 'next/navigation';

import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';
import { ADMIN_API_ROUTES } from '@/constants/routes/admin.routes';
import { ADMINISTRATOR_API_ROUTES } from '@/constants/routes/administrator.routes';
import { USER_API_ROUTES } from '@/constants/routes/user.routes';
import { type StakeholderType } from '@/types/auth.types';

// =============================================
// Role Config
// =============================================

interface RoleConfig {
    role: StakeholderType;
    apiEndpoint: string;
    loginPath: string;
    title: string;
}

// Token prefix to role mapping (matches backend)
const PREFIX_TO_CONFIG: Record<string, RoleConfig> = {
    usr: {
        role: 'USER',
        apiEndpoint: USER_API_ROUTES.auth.resetPassword,
        loginPath: '/login',
        title: 'Reset Password',
    },
    adm: {
        role: 'ADMIN',
        apiEndpoint: ADMIN_API_ROUTES.auth.resetPassword,
        loginPath: '/login/admin',
        title: 'Admin Reset Password',
    },
    sup: {
        role: 'ADMINISTRATOR',
        apiEndpoint: ADMINISTRATOR_API_ROUTES.auth.resetPassword,
        loginPath: '/login/administrator',
        title: 'Administrator Reset Password',
    },
};

// Default config for invalid tokens
const DEFAULT_CONFIG: RoleConfig = {
    role: 'USER',
    apiEndpoint: USER_API_ROUTES.auth.resetPassword,
    loginPath: '/login',
    title: 'Reset Password',
};

// Extract role prefix from token (e.g., "usr_abc123..." -> "usr")
const extractRoleFromToken = (token: string | null): RoleConfig => {
    if (!token) return DEFAULT_CONFIG;
    const prefix = token.split('_')[0];
    return prefix ? (PREFIX_TO_CONFIG[prefix] ?? DEFAULT_CONFIG) : DEFAULT_CONFIG;
};

// =============================================
// Inner Component (needs Suspense for useSearchParams)
// =============================================

const ResetPasswordContent = () => {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const config = extractRoleFromToken(token);

    return (
        <ResetPasswordForm
            role={config.role}
            apiEndpoint={config.apiEndpoint}
            loginPath={config.loginPath}
            title={config.title}
            subtitle='Enter your new password'
        />
    );
};

// =============================================
// Page Component
// =============================================

const ResetPasswordPage = () => (
    <Suspense fallback={<div className='flex min-h-screen items-center justify-center bg-slate-900 text-slate-400'>Loading...</div>}>
        <ResetPasswordContent />
    </Suspense>
);

export default ResetPasswordPage;

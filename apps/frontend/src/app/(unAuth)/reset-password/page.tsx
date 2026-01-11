'use client';

// =============================================
// Unified Reset Password Page
// Extracts role from token prefix (usr_, adm_, sup_)
// =============================================

import { Suspense } from 'react';

import { useSearchParams } from 'next/navigation';

import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';
import { type StakeholderType } from '@/types/auth.types';

// =============================================
// Role Config
// =============================================

interface RoleConfig {
    role: StakeholderType;
    loginPath: string;
    title: string;
}

// Token prefix to role mapping (matches backend)
const PREFIX_TO_CONFIG: Record<string, RoleConfig> = {
    usr: { role: 'USER', loginPath: '/login', title: 'Reset Password' },
    adm: { role: 'ADMIN', loginPath: '/login/admin', title: 'Admin Reset Password' },
    sup: { role: 'ADMINISTRATOR', loginPath: '/login/administrator', title: 'Administrator Reset Password' },
};

// Default config for invalid tokens
const DEFAULT_CONFIG: RoleConfig = { role: 'USER', loginPath: '/login', title: 'Reset Password' };

// Extract role config from token prefix
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

    return <ResetPasswordForm loginPath={config.loginPath} title={config.title} subtitle='Enter your new password' />;
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

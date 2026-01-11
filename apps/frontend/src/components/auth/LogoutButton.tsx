'use client';

// =============================================
// LogoutButton - Client-side logout with server action
// =============================================

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import { logoutAction } from '@/server/actions/auth/login.actions';
import { type StakeholderType } from '@/types/auth.types';

interface LogoutButtonProps {
    role: StakeholderType;
    loginPath: string;
    className?: string;
}

export const LogoutButton = ({ role, loginPath, className }: LogoutButtonProps) => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleLogout = async () => {
        setLoading(true);
        await logoutAction({ stakeholder: role });
        router.push(loginPath);
        router.refresh();
    };

    return (
        <button
            onClick={handleLogout}
            disabled={loading}
            className={className ?? 'rounded-xl bg-gradient-to-r from-red-600 to-red-500 px-6 py-3 font-semibold text-white shadow-lg shadow-red-500/25 transition-all hover:from-red-500 hover:to-red-400 disabled:opacity-50'}
        >
            {loading ? 'Logging out...' : 'Logout'}
        </button>
    );
};

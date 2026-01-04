'use client';

// =============================================
// LogoutButton - Client-side logout with redirect
// =============================================

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import { clientApi } from '@/lib/http';
import { type StakeholderType } from '@/types/auth.types';

interface LogoutButtonProps {
    apiEndpoint: string;
    loginPath: string;
    role: StakeholderType;
    className?: string;
}

export const LogoutButton = ({ apiEndpoint, loginPath, className }: LogoutButtonProps) => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleLogout = async () => {
        setLoading(true);
        await clientApi.post(apiEndpoint, {});
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

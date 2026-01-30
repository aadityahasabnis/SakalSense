import { LogoutButton } from '@/components/auth/LogoutButton';
import { STAKEHOLDER, STAKEHOLDER_LABELS } from '@/constants/auth.constants';
import { getCurrentUser } from '@/lib/auth';

import { DashboardClient } from './DashboardClient';

const AdministratorDashboardPage = async () => {
    const user = await getCurrentUser(STAKEHOLDER.ADMINISTRATOR);

    // Middleware handles auth redirect, user should always exist here
    if (!user) return null;

    return (
        <div className='min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900'>
            {/* Header */}
            <header className='border-b border-zinc-700/50 bg-zinc-900/80 backdrop-blur-xl sticky top-0 z-10'>
                <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
                    <div className='flex h-16 items-center justify-between'>
                        <div className='flex items-center gap-4'>
                            <div className='flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1'>
                                <svg className='h-4 w-4 text-amber-400' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                                    <path
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                        strokeWidth={2}
                                        d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'
                                    />
                                </svg>
                                <span className='text-sm font-medium text-amber-300'>Administrator</span>
                            </div>
                            <div>
                                <h1 className='text-lg font-semibold text-white'>{user.fullName}</h1>
                                <p className='text-xs text-zinc-400'>{STAKEHOLDER_LABELS[user.stakeholder]}</p>
                            </div>
                        </div>
                        <LogoutButton role='ADMINISTRATOR' loginPath='/login/administrator' />
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className='mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8'>
                {/* Security Notice */}
                <div className='mb-6 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4'>
                    <div className='flex items-center gap-3'>
                        <svg className='h-5 w-5 text-amber-400 flex-shrink-0' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                            <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
                            />
                        </svg>
                        <p className='text-sm text-amber-200'>You have elevated system privileges. All actions are logged and monitored.</p>
                    </div>
                </div>

                {/* Dashboard Client */}
                <DashboardClient />
            </main>
        </div>
    );
};

export default AdministratorDashboardPage;

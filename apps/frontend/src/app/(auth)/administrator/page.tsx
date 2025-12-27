import { STAKEHOLDER, STAKEHOLDER_LABELS } from 'sakalsense-core';

import { getCookieInfo, getCurrentUser } from '@/lib/auth';

const AdministratorDashboardPage = async () => {
    const user = await getCurrentUser(STAKEHOLDER.ADMINISTRATOR);
    const cookieInfo = await getCookieInfo(STAKEHOLDER.ADMINISTRATOR);

    // Middleware handles auth redirect, user should always exist here
    if (!user) return null;

    return (
        <div className='min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 p-6'>
            <div className='mx-auto max-w-4xl'>
                {/* Header */}
                <div className='mb-8 text-center'>
                    <div className='mb-4 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-2'>
                        <svg className='h-4 w-4 text-amber-400' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                            <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'
                            />
                        </svg>
                        <span className='text-sm font-medium text-amber-300'>System Administrator</span>
                    </div>
                    <h1 className='mb-2 text-4xl font-bold text-white'>Welcome, {user.fullName}!</h1>
                    <p className='text-zinc-400'>
                        Logged in as <span className='font-medium text-amber-400'>{STAKEHOLDER_LABELS[user.stakeholder]}</span>
                    </p>
                </div>

                {/* Security Notice */}
                <div className='mb-6 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4'>
                    <div className='flex items-center gap-3'>
                        <svg className='h-5 w-5 text-amber-400' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
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

                {/* Session Info Card */}
                <div className='mb-6 rounded-2xl border border-zinc-700/50 bg-zinc-800/50 p-6 shadow-xl backdrop-blur-xl'>
                    <h2 className='mb-4 flex items-center gap-2 text-xl font-semibold text-white'>
                        <svg className='h-5 w-5 text-amber-400' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                            <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z'
                            />
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' />
                        </svg>
                        Administrator Session Information
                    </h2>
                    <div className='grid gap-4 md:grid-cols-2'>
                        <InfoCard label='User ID' value={user.userId} />
                        <InfoCard label='Full Name' value={user.fullName} />
                        <InfoCard label='Role' value={user.role} />
                        <InfoCard label='Session ID' value={user.sessionId} />
                        {user.avatarLink && <InfoCard label='Avatar' value={user.avatarLink} />}
                    </div>
                </div>

                {/* Cookie Info Card */}
                <div className='rounded-2xl border border-zinc-700/50 bg-zinc-800/50 p-6 shadow-xl backdrop-blur-xl'>
                    <h2 className='mb-4 flex items-center gap-2 text-xl font-semibold text-white'>
                        <svg className='h-5 w-5 text-green-400' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                            <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'
                            />
                        </svg>
                        Cookie Data (System Token)
                    </h2>
                    <div className='space-y-4'>
                        <InfoCard label='Cookie Name' value={cookieInfo.name} />
                        <InfoCard label='Token (truncated)' value={cookieInfo.value ?? 'No token found'} />
                        {cookieInfo.decoded && (
                            <div className='rounded-lg border border-zinc-600 bg-zinc-900/50 p-4'>
                                <p className='mb-2 text-sm font-medium text-zinc-300'>Decoded JWT Payload:</p>
                                <pre className='overflow-x-auto rounded bg-black p-3 text-xs text-green-400'>{JSON.stringify(cookieInfo.decoded, null, 2)}</pre>
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className='mt-6 flex justify-center'>
                    <form action='/api/auth/administrator/logout' method='POST'>
                        <button
                            type='submit'
                            className='rounded-xl bg-gradient-to-r from-red-600 to-red-500 px-6 py-3 font-semibold text-white shadow-lg shadow-red-500/25 transition-all hover:from-red-500 hover:to-red-400'
                        >
                            Logout
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

const InfoCard = ({ label, value }: { label: string; value: string }) => (
    <div className='rounded-lg border border-zinc-600/50 bg-zinc-700/30 p-4'>
        <p className='mb-1 text-xs font-medium uppercase tracking-wide text-zinc-400'>{label}</p>
        <p className='truncate font-mono text-sm text-white'>{value}</p>
    </div>
);

export default AdministratorDashboardPage;

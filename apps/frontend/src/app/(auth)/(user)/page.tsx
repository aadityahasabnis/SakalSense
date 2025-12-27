import { STAKEHOLDER, STAKEHOLDER_LABELS } from 'sakalsense-core';

import { getCookieInfo, getCurrentUser } from '@/lib/auth';

const UserDashboardPage = async () => {
    const user = await getCurrentUser(STAKEHOLDER.USER);
    const cookieInfo = await getCookieInfo(STAKEHOLDER.USER);

    // Middleware handles auth redirect, user should always exist here
    if (!user) return null;

    return (
        <div className='min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6'>
            <div className='mx-auto max-w-4xl'>
                {/* Header */}
                <div className='mb-8 text-center'>
                    <h1 className='mb-2 text-4xl font-bold text-white'>Welcome, {user.fullName}!</h1>
                    <p className='text-slate-400'>
                        Logged in as <span className='font-medium text-blue-400'>{STAKEHOLDER_LABELS[user.stakeholder]}</span>
                    </p>
                </div>

                {/* Session Info Card */}
                <div className='mb-6 rounded-2xl border border-slate-700/50 bg-slate-800/50 p-6 shadow-xl backdrop-blur-xl'>
                    <h2 className='mb-4 flex items-center gap-2 text-xl font-semibold text-white'>
                        <svg className='h-5 w-5 text-blue-400' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' />
                        </svg>
                        Session Information
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
                <div className='rounded-2xl border border-slate-700/50 bg-slate-800/50 p-6 shadow-xl backdrop-blur-xl'>
                    <h2 className='mb-4 flex items-center gap-2 text-xl font-semibold text-white'>
                        <svg className='h-5 w-5 text-amber-400' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                            <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'
                            />
                        </svg>
                        Cookie Data
                    </h2>
                    <div className='space-y-4'>
                        <InfoCard label='Cookie Name' value={cookieInfo.name} />
                        <InfoCard label='Token (truncated)' value={cookieInfo.value ?? 'No token found'} />
                        {cookieInfo.decoded && (
                            <div className='rounded-lg border border-slate-600 bg-slate-700/50 p-4'>
                                <p className='mb-2 text-sm font-medium text-slate-300'>Decoded JWT Payload:</p>
                                <pre className='overflow-x-auto rounded bg-slate-900 p-3 text-xs text-green-400'>{JSON.stringify(cookieInfo.decoded, null, 2)}</pre>
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className='mt-6 flex justify-center'>
                    <form action='/api/auth/user/logout' method='POST'>
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
    <div className='rounded-lg border border-slate-600 bg-slate-700/30 p-4'>
        <p className='mb-1 text-xs font-medium uppercase tracking-wide text-slate-400'>{label}</p>
        <p className='truncate font-mono text-sm text-white'>{value}</p>
    </div>
);

export default UserDashboardPage;

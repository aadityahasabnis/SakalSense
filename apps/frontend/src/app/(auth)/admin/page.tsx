import { STAKEHOLDER, STAKEHOLDER_LABELS } from '@/constants/auth.constants';
import { getCookieInfo, getCurrentUser } from '@/lib/auth';

const AdminDashboardPage = async () => {
    const user = await getCurrentUser(STAKEHOLDER.ADMIN);
    const cookieInfo = await getCookieInfo(STAKEHOLDER.ADMIN);

    // Middleware handles auth redirect, user should always exist here
    if (!user) return null;

    return (
        <div className='min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-950 p-6'>
            <div className='mx-auto max-w-4xl'>
                {/* Header */}
                <div className='mb-8 text-center'>
                    <div className='mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-2'>
                        <svg className='h-4 w-4 text-indigo-400' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                            <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'
                            />
                        </svg>
                        <span className='text-sm font-medium text-indigo-300'>Admin Portal</span>
                    </div>
                    <h1 className='mb-2 text-4xl font-bold text-white'>Welcome, {user.fullName}!</h1>
                    <p className='text-slate-400'>
                        Logged in as <span className='font-medium text-indigo-400'>{STAKEHOLDER_LABELS[user.stakeholder]}</span>
                    </p>
                </div>

                {/* Session Info Card */}
                <div className='mb-6 rounded-2xl border border-indigo-700/50 bg-indigo-900/30 p-6 shadow-xl backdrop-blur-xl'>
                    <h2 className='mb-4 flex items-center gap-2 text-xl font-semibold text-white'>
                        <svg className='h-5 w-5 text-indigo-400' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                            <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                            />
                        </svg>
                        Admin Session Information
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
                <div className='rounded-2xl border border-indigo-700/50 bg-indigo-900/30 p-6 shadow-xl backdrop-blur-xl'>
                    <h2 className='mb-4 flex items-center gap-2 text-xl font-semibold text-white'>
                        <svg className='h-5 w-5 text-amber-400' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                            <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'
                            />
                        </svg>
                        Cookie Data (Admin Token)
                    </h2>
                    <div className='space-y-4'>
                        <InfoCard label='Cookie Name' value={cookieInfo.name} />
                        <InfoCard label='Token (truncated)' value={cookieInfo.value ?? 'No token found'} />
                        {cookieInfo.decoded && (
                            <div className='rounded-lg border border-indigo-600 bg-indigo-900/50 p-4'>
                                <p className='mb-2 text-sm font-medium text-indigo-300'>Decoded JWT Payload:</p>
                                <pre className='overflow-x-auto rounded bg-slate-900 p-3 text-xs text-green-400'>{JSON.stringify(cookieInfo.decoded, null, 2)}</pre>
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className='mt-6 flex justify-center'>
                    <form action='/api/auth/admin/logout' method='POST'>
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
    <div className='rounded-lg border border-indigo-600/50 bg-indigo-800/30 p-4'>
        <p className='mb-1 text-xs font-medium uppercase tracking-wide text-indigo-300'>{label}</p>
        <p className='truncate font-mono text-sm text-white'>{value}</p>
    </div>
);

export default AdminDashboardPage;

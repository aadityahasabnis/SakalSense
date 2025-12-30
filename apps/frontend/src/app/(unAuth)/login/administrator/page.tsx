'use client';

import React, { useState } from 'react';

import { useRouter } from 'next/navigation';

import { SessionLimitDialog } from '@/components/auth/SessionLimitDialog';
import { ADMINISTRATOR_API_ROUTES } from '@/constants/routes/administrator.routes';
import { clientApi } from '@/lib/http';
import { type ILoginResponse, type ISession } from '@/lib/interfaces';

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

const AdministratorLoginPage = () => {
    const router = useRouter();

    const [form, setForm] = useState({
        email: '',
        password: '',
        loading: false,
        error: null as string | null,
    });

    const [sessionLimit, setSessionLimit] = useState<{ show: boolean; sessions: Array<ISession> }>({
        show: false,
        sessions: [],
    });

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setForm((prev) => ({ ...prev, loading: true, error: null }));

        const response = await clientApi.post<ILoginResponse>(ADMINISTRATOR_API_ROUTES.auth.login, {
            email: form.email,
            password: form.password,
        });

        if (response.success) {
            router.push('/administrator');
            return;
        }

        // Session limit exceeded - show dialog
        if (response.data?.sessionLimitExceeded && response.data?.activeSessions) {
            setSessionLimit({ show: true, sessions: response.data.activeSessions });
            setForm((prev) => ({ ...prev, loading: false }));
            return;
        }

        setForm((prev) => ({ ...prev, loading: false, error: response.error ?? 'Authentication failed' }));
    };

    const handleSessionTerminated = () => {
        setSessionLimit({ show: false, sessions: [] });
        // Retry login automatically
        const formElement = document.querySelector('form');
        if (formElement) formElement.requestSubmit();
    };

    return (
        <>
            <div className='flex min-h-screen items-center justify-center bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 p-4'>
                <div className='w-full max-w-md rounded-2xl border border-zinc-700/50 bg-zinc-800/50 p-8 shadow-2xl backdrop-blur-xl'>
                    {/* Security notice */}
                    <div className='mb-6 flex items-center justify-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-amber-400'>
                        <svg className='h-5 w-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                            <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'
                            />
                        </svg>
                        <span className='text-sm font-medium'>Restricted Access</span>
                    </div>

                    <div className='mb-8 text-center'>
                        <h1 className='mb-2 text-3xl font-bold text-white'>Administrator</h1>
                        <p className='text-zinc-400'>System Management Portal</p>
                    </div>

                    <form onSubmit={handleSubmit} className='space-y-6'>
                        {form.error && <div className='rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-center text-sm text-red-400'>{form.error}</div>}

                        <div>
                            <label htmlFor='email' className='mb-2 block text-sm font-medium text-zinc-300'>
                                Email
                            </label>
                            <input
                                id='email'
                                type='email'
                                required
                                value={form.email}
                                onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
                                className='w-full rounded-xl border border-zinc-600 bg-zinc-700/50 px-4 py-3 text-white placeholder-zinc-400 transition-all focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20'
                                placeholder='administrator@sakalsense.com'
                            />
                        </div>

                        <div>
                            <label htmlFor='password' className='mb-2 block text-sm font-medium text-zinc-300'>
                                Password
                            </label>
                            <input
                                id='password'
                                type='password'
                                required
                                value={form.password}
                                onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
                                className='w-full rounded-xl border border-zinc-600 bg-zinc-700/50 px-4 py-3 text-white placeholder-zinc-400 transition-all focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20'
                                placeholder='Enter your password'
                            />
                        </div>

                        <button
                            type='submit'
                            disabled={form.loading}
                            className='w-full rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 py-3 font-semibold text-white shadow-lg shadow-amber-500/25 transition-all hover:from-amber-500 hover:to-amber-400 disabled:cursor-not-allowed disabled:opacity-50'
                        >
                            {form.loading ? 'Authenticating...' : 'Access System'}
                        </button>
                    </form>

                    <p className='mt-6 text-center text-xs text-zinc-500'>This is a restricted area. Unauthorized access is prohibited.</p>
                </div>
            </div>

            {sessionLimit.show && (
                <SessionLimitDialog
                    role='ADMINISTRATOR'
                    sessions={sessionLimit.sessions}
                    credentials={{ email: form.email, password: form.password }}
                    onClose={() => setSessionLimit({ show: false, sessions: [] })}
                    onSessionTerminated={handleSessionTerminated}
                />
            )}
        </>
    );
};

export default AdministratorLoginPage;

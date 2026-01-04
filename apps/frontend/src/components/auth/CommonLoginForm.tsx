'use client';

import { type FormEvent, useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { SessionLimitDialog } from './SessionLimitDialog';

import { clientApi } from '@/lib/http';
import { type ILoginResponse, type ISession } from '@/lib/interfaces';
import { type StakeholderType } from '@/types/auth.types';

// =============================================
// Types
// =============================================

interface CommonLoginFormProps {
    role: StakeholderType;
    apiEndpoint: string;
    redirectPath: string;
    registerPath?: string;
    forgotPasswordPath?: string;
    title?: string;
    subtitle?: string;
}

interface LoginFormState {
    email: string;
    password: string;
    loading: boolean;
    error: string | null;
}

interface SessionLimitState {
    show: boolean;
    sessions: Array<ISession>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export const CommonLoginForm = ({ role, apiEndpoint, redirectPath, registerPath, forgotPasswordPath, title = 'Welcome Back', subtitle }: CommonLoginFormProps) => {
    const router = useRouter();

    const [form, setForm] = useState<LoginFormState>({
        email: '',
        password: '',
        loading: false,
        error: null,
    });

    const [sessionLimit, setSessionLimit] = useState<SessionLimitState>({
        show: false,
        sessions: [],
    });

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setForm((prev) => ({ ...prev, loading: true, error: null }));

        const response = await clientApi.post<ILoginResponse>(apiEndpoint, {
            email: form.email,
            password: form.password,
        });

        if (response.success) {
            router.push(redirectPath);
            return;
        }

        // Session limit exceeded - show dialog
        if (response.data?.sessionLimitExceeded && response.data?.activeSessions) {
            setSessionLimit({ show: true, sessions: response.data.activeSessions });
            setForm((prev) => ({ ...prev, loading: false }));
            return;
        }

        setForm((prev) => ({ ...prev, loading: false, error: response.error ?? 'Login failed' }));
    };

    const handleSessionTerminated = () => {
        setSessionLimit({ show: false, sessions: [] });
        // Retry login automatically
        const formElement = document.querySelector('form');
        if (formElement) formElement.requestSubmit();
    };

    return (
        <>
            <div className='flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4'>
                <div className='w-full max-w-md rounded-2xl border border-slate-700/50 bg-slate-800/50 p-8 shadow-2xl backdrop-blur-xl'>
                    <div className='mb-8 text-center'>
                        <h1 className='mb-2 text-3xl font-bold text-white'>{title}</h1>
                        {subtitle && <p className='text-slate-400'>{subtitle}</p>}
                    </div>

                    <form onSubmit={handleSubmit} className='space-y-5'>
                        {form.error && <div className='rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-center text-sm text-red-400'>{form.error}</div>}

                        <div>
                            <label htmlFor='email' className='mb-2 block text-sm font-medium text-slate-300'>
                                Email
                            </label>
                            <input
                                id='email'
                                type='email'
                                required
                                value={form.email}
                                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                                className='w-full rounded-xl border border-slate-600 bg-slate-700/50 px-4 py-3 text-white placeholder-slate-400 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20'
                                placeholder='Enter your email'
                            />
                        </div>

                        <div>
                            <label htmlFor='password' className='mb-2 block text-sm font-medium text-slate-300'>
                                Password
                            </label>
                            <input
                                id='password'
                                type='password'
                                required
                                value={form.password}
                                onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                                className='w-full rounded-xl border border-slate-600 bg-slate-700/50 px-4 py-3 text-white placeholder-slate-400 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20'
                                placeholder='Enter your password'
                            />
                            {forgotPasswordPath && (
                                <div className='mt-2 text-right'>
                                    <Link href={forgotPasswordPath} className='text-sm text-slate-400 hover:text-blue-400 transition-colors'>
                                        Forgot Password?
                                    </Link>
                                </div>
                            )}
                        </div>

                        <button
                            type='submit'
                            disabled={form.loading}
                            className='w-full rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 py-3 font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:from-blue-500 hover:to-blue-400 disabled:cursor-not-allowed disabled:opacity-50'
                        >
                            {form.loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>

                    {registerPath && (
                        <p className='mt-6 text-center text-sm text-slate-400'>
                            Don&#39;t have an account?{' '}
                            <Link href={registerPath} className='font-medium text-blue-400 hover:text-blue-300'>
                                Sign up
                            </Link>
                        </p>
                    )}
                </div>
            </div>

            {sessionLimit.show && (
                <SessionLimitDialog
                    role={role}
                    sessions={sessionLimit.sessions}
                    credentials={{ email: form.email, password: form.password }}
                    onClose={() => setSessionLimit({ show: false, sessions: [] })}
                    onSessionTerminated={handleSessionTerminated}
                />
            )}
        </>
    );
};

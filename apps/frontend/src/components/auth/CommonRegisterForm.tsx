'use client';

import { type FormEvent, useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { type ILoginResponse } from '@sakalsense/core';

import { http } from '@/lib/http';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface CommonRegisterFormProps {
    role: 'USER' | 'ADMIN';
    apiEndpoint: string;
    redirectPath: string;
    loginPath: string;
    title?: string;
    subtitle?: string;
    requireInviteCode?: boolean;
}

interface RegisterFormState {
    fullName: string;
    email: string;
    password: string;
    confirmPassword: string;
    mobile: string;
    inviteCode: string;
    loading: boolean;
    error: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export const CommonRegisterForm = ({ apiEndpoint, redirectPath, loginPath, title = 'Create Account', subtitle, requireInviteCode = false }: CommonRegisterFormProps) => {
    const router = useRouter();

    const [form, setForm] = useState<RegisterFormState>({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        mobile: '',
        inviteCode: '',
        loading: false,
        error: null,
    });

    const updateField = (field: keyof RegisterFormState, value: string) => {
        setForm((prev) => ({ ...prev, [field]: value, error: null }));
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        // Validation
        if (form.password !== form.confirmPassword) {
            setForm((prev) => ({ ...prev, error: 'Passwords do not match' }));
            return;
        }

        if (form.password.length < 6) {
            setForm((prev) => ({ ...prev, error: 'Password must be at least 6 characters' }));
            return;
        }

        setForm((prev) => ({ ...prev, loading: true, error: null }));

        // Build request body
        const body: Record<string, unknown> = {
            fullName: form.fullName,
            email: form.email,
            password: form.password,
        };

        if (form.mobile) body.mobile = form.mobile;
        if (requireInviteCode) body.inviteCode = form.inviteCode;

        const response = await http.post<ILoginResponse>(apiEndpoint, body);

        if (response.success) {
            router.push(redirectPath);
            return;
        }

        setForm((prev) => ({ ...prev, loading: false, error: response.error ?? 'Registration failed' }));
    };

    return (
        <div className='flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4'>
            <div className='w-full max-w-md rounded-2xl border border-slate-700/50 bg-slate-800/50 p-8 shadow-2xl backdrop-blur-xl'>
                <div className='mb-8 text-center'>
                    <h1 className='mb-2 text-3xl font-bold text-white'>{title}</h1>
                    {subtitle && <p className='text-slate-400'>{subtitle}</p>}
                </div>

                <form onSubmit={handleSubmit} className='space-y-5'>
                    {form.error && <div className='rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-center text-sm text-red-400'>{form.error}</div>}

                    <div>
                        <label htmlFor='fullName' className='mb-2 block text-sm font-medium text-slate-300'>
                            Full Name
                        </label>
                        <input
                            id='fullName'
                            type='text'
                            required
                            value={form.fullName}
                            onChange={(e) => updateField('fullName', e.target.value)}
                            className='w-full rounded-xl border border-slate-600 bg-slate-700/50 px-4 py-3 text-white placeholder-slate-400 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20'
                            placeholder='Enter your full name'
                        />
                    </div>

                    <div>
                        <label htmlFor='email' className='mb-2 block text-sm font-medium text-slate-300'>
                            Email
                        </label>
                        <input
                            id='email'
                            type='email'
                            required
                            value={form.email}
                            onChange={(e) => updateField('email', e.target.value)}
                            className='w-full rounded-xl border border-slate-600 bg-slate-700/50 px-4 py-3 text-white placeholder-slate-400 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20'
                            placeholder='Enter your email'
                        />
                    </div>

                    {!requireInviteCode && (
                        <div>
                            <label htmlFor='mobile' className='mb-2 block text-sm font-medium text-slate-300'>
                                Mobile <span className='text-slate-500'>(optional)</span>
                            </label>
                            <input
                                id='mobile'
                                type='tel'
                                value={form.mobile}
                                onChange={(e) => updateField('mobile', e.target.value)}
                                className='w-full rounded-xl border border-slate-600 bg-slate-700/50 px-4 py-3 text-white placeholder-slate-400 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20'
                                placeholder='Enter your mobile number'
                            />
                        </div>
                    )}

                    <div>
                        <label htmlFor='password' className='mb-2 block text-sm font-medium text-slate-300'>
                            Password
                        </label>
                        <input
                            id='password'
                            type='password'
                            required
                            value={form.password}
                            onChange={(e) => updateField('password', e.target.value)}
                            className='w-full rounded-xl border border-slate-600 bg-slate-700/50 px-4 py-3 text-white placeholder-slate-400 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20'
                            placeholder='Create a password'
                        />
                    </div>

                    <div>
                        <label htmlFor='confirmPassword' className='mb-2 block text-sm font-medium text-slate-300'>
                            Confirm Password
                        </label>
                        <input
                            id='confirmPassword'
                            type='password'
                            required
                            value={form.confirmPassword}
                            onChange={(e) => updateField('confirmPassword', e.target.value)}
                            className='w-full rounded-xl border border-slate-600 bg-slate-700/50 px-4 py-3 text-white placeholder-slate-400 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20'
                            placeholder='Confirm your password'
                        />
                    </div>

                    {requireInviteCode && (
                        <div>
                            <label htmlFor='inviteCode' className='mb-2 block text-sm font-medium text-slate-300'>
                                Invite Code
                            </label>
                            <input
                                id='inviteCode'
                                type='text'
                                required
                                value={form.inviteCode}
                                onChange={(e) => updateField('inviteCode', e.target.value)}
                                className='w-full rounded-xl border border-slate-600 bg-slate-700/50 px-4 py-3 text-white placeholder-slate-400 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20'
                                placeholder='Enter your invite code'
                            />
                        </div>
                    )}

                    <button
                        type='submit'
                        disabled={form.loading}
                        className='w-full rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 py-3 font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:from-blue-500 hover:to-blue-400 disabled:cursor-not-allowed disabled:opacity-50'
                    >
                        {form.loading ? 'Creating account...' : 'Create Account'}
                    </button>
                </form>

                <p className='mt-6 text-center text-sm text-slate-400'>
                    Already have an account?{' '}
                    <Link href={loginPath} className='font-medium text-blue-400 hover:text-blue-300'>
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
};

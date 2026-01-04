'use client';

// =============================================
// ForgotPasswordForm - Request password reset email
// =============================================

import { useState } from 'react';

import Link from 'next/link';

import { Form } from '@/components/form/Form';
import { clientApiCall } from '@/lib/http';
import { type StakeholderType } from '@/types/auth.types';
import { type FormConfig, type FormValues } from '@/types/form.types';

// =============================================
// Types
// =============================================

interface ForgotPasswordFormProps {
    role: StakeholderType;
    apiEndpoint: string;
    loginPath: string;
    title?: string;
    subtitle?: string;
}

// =============================================
// Component
// =============================================

export const ForgotPasswordForm = ({
    apiEndpoint,
    loginPath,
    title = 'Forgot Password',
    subtitle = "Enter your email and we'll send you a reset link",
}: ForgotPasswordFormProps) => {
    const [success, setSuccess] = useState(false);
    const [email, setEmail] = useState('');

    // API call for forgot password
    const requestPasswordReset = async (values: FormValues) => {
        setEmail(String(values.email ?? ''));
        return clientApiCall<void>({
            method: 'POST',
            url: apiEndpoint,
            body: { email: values.email },
        });
    };

    // Form configuration
    const forgotPasswordFormConfig: FormConfig = {
        fields: [
            {
                type: 'email',
                name: 'email',
                label: 'Email Address',
                placeholder: 'Enter your email',
                required: true,
                autoFocus: true,
            },
        ],
        submit: {
            label: 'Send Reset Link',
            loadingLabel: 'Sending...',
            action: requestPasswordReset,
            onSuccess: () => setSuccess(true),
        },
        layout: 'vertical',
    };

    // Success state
    if (success) {
        return (
            <div className='flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4'>
                <div className='w-full max-w-md rounded-2xl border border-slate-700/50 bg-slate-800/50 p-8 shadow-2xl backdrop-blur-xl'>
                    <div className='mb-6 text-center'>
                        <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20'>
                            <svg className='h-8 w-8 text-green-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                            </svg>
                        </div>
                        <h1 className='mb-2 text-2xl font-bold text-white'>Check Your Email</h1>
                        <p className='text-slate-400'>
                            If an account exists with <span className='font-medium text-white'>{email}</span>, you&apos;ll receive a password reset link shortly.
                        </p>
                    </div>
                    <Link
                        href={loginPath}
                        className='block w-full rounded-xl bg-slate-700 py-3 text-center font-semibold text-white transition-all hover:bg-slate-600'
                    >
                        Back to Login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className='flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4'>
            <div className='w-full max-w-md rounded-2xl border border-slate-700/50 bg-slate-800/50 p-8 shadow-2xl backdrop-blur-xl'>
                <div className='mb-8 text-center'>
                    <h1 className='mb-2 text-3xl font-bold text-white'>{title}</h1>
                    <p className='text-slate-400'>{subtitle}</p>
                </div>

                <Form config={forgotPasswordFormConfig} />

                <p className='mt-6 text-center text-sm text-slate-400'>
                    Remember your password?{' '}
                    <Link href={loginPath} className='font-medium text-blue-400 hover:text-blue-300'>
                        Back to Login
                    </Link>
                </p>
            </div>
        </div>
    );
};

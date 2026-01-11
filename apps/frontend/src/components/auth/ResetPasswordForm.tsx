'use client';

// =============================================
// ResetPasswordForm - Reset password with token from URL
// =============================================

import { useEffect, useState } from 'react';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

import { Form } from '@/components/form/Form';
import { resetPasswordAction } from '@/server/actions/auth/password-reset.actions';
import { type FormConfig, type FormValues } from '@/types/form.types';

// =============================================
// Types
// =============================================

interface ResetPasswordFormProps {
    loginPath: string;
    title?: string;
    subtitle?: string;
}

// =============================================
// Component
// =============================================

export const ResetPasswordForm = ({ loginPath, title = 'Reset Password', subtitle = 'Enter your new password' }: ResetPasswordFormProps) => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [success, setSuccess] = useState(false);

    // Redirect if no token
    useEffect(() => {
        if (!token) router.push(loginPath);
    }, [token, router, loginPath]);

    // Server action for reset password
    const resetPassword = async (values: FormValues) => {
        if (!token) return { success: false, error: 'Invalid reset token' };
        return resetPasswordAction({ token, newPassword: String(values.newPassword) });
    };

    // Form configuration with password match validation
    const resetPasswordFormConfig: FormConfig = {
        fields: [
            {
                type: 'password',
                name: 'newPassword',
                label: 'New Password',
                placeholder: 'Enter new password',
                required: true,
                minLength: 8,
                autoFocus: true,
            },
            {
                type: 'password',
                name: 'confirmPassword',
                label: 'Confirm Password',
                placeholder: 'Confirm new password',
                required: true,
                minLength: 8,
                validate: (value, allValues) => (value !== allValues.newPassword ? 'Passwords do not match' : undefined),
            },
        ],
        submit: {
            label: 'Reset Password',
            loadingLabel: 'Resetting...',
            action: resetPassword,
            onSuccess: () => setSuccess(true),
        },
        layout: 'vertical',
    };

    // No token state
    if (!token) {
        return (
            <div className='flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4'>
                <div className='text-slate-400'>Redirecting...</div>
            </div>
        );
    }

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
                        <h1 className='mb-2 text-2xl font-bold text-white'>Password Reset Successful</h1>
                        <p className='text-slate-400'>Your password has been updated. You can now log in with your new password.</p>
                    </div>
                    <Link
                        href={loginPath}
                        className='block w-full rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 py-3 text-center font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:from-blue-500 hover:to-blue-400'
                    >
                        Go to Login
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

                <Form config={resetPasswordFormConfig} />

                <p className='mt-6 text-center text-sm text-slate-400'>
                    <Link href={loginPath} className='font-medium text-blue-400 hover:text-blue-300'>
                        Back to Login
                    </Link>
                </p>
            </div>
        </div>
    );
};

'use client';

import { Suspense } from 'react';

import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';

const UserResetPasswordPage = () => (
    <Suspense fallback={<div className='flex min-h-screen items-center justify-center bg-slate-900 text-slate-400'>Loading...</div>}>
        <ResetPasswordForm loginPath='/login' title='Reset Password' subtitle='Enter your new password' />
    </Suspense>
);

export default UserResetPasswordPage;

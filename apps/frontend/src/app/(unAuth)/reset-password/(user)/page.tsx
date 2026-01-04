'use client';

import { Suspense } from 'react';

import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';
import { USER_API_ROUTES } from '@/constants/routes/user.routes';

const UserResetPasswordPage = () => (
    <Suspense fallback={<div className='flex min-h-screen items-center justify-center bg-slate-900 text-slate-400'>Loading...</div>}>
        <ResetPasswordForm
            role='USER'
            apiEndpoint={USER_API_ROUTES.auth.resetPassword}
            loginPath='/login'
            title='Reset Password'
            subtitle='Enter your new password'
        />
    </Suspense>
);

export default UserResetPasswordPage;

'use client';
// =============================================
// Admin Request Form - Config-driven admin registration request
// =============================================

import Link from 'next/link';

import { Form } from '@/components/form/Form';
import { submitAdminRequest } from '@/server/actions/auth/admin-request.actions';
import { type FormConfig, type FormValues } from '@/types/form.types';

// Form configuration using existing Form system
const adminRequestFormConfig: FormConfig = {
    id: 'admin-request-form',
    layout: 'vertical',
    fields: [
        {
            type: 'text',
            name: 'fullName',
            label: 'Full Name',
            placeholder: 'Enter your full name',
            required: true,
            minLength: 2,
            maxLength: 100,
            autoFocus: true,
        },
        {
            type: 'email',
            name: 'email',
            label: 'Email Address',
            placeholder: 'Enter your email',
            required: true,
        },
        {
            type: 'textarea',
            name: 'reason',
            label: 'Why do you need admin access?',
            placeholder: 'Please explain your role and why you need admin access...',
            description: 'This helps us process your request faster',
            rows: 4,
        },
    ],
    submit: {
        action: async (values: FormValues) => {
            return submitAdminRequest({
                fullName: values.fullName as string,
                email: values.email as string,
                reason: values.reason as string | undefined,
            });
        },
        label: 'Submit Request',
        loadingLabel: 'Submitting...',
        redirectOnSuccess: '/register/admin/pending',
        className: 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400',
    },
};

interface AdminRequestFormProps {
    className?: string;
}

export const AdminRequestForm = ({ className }: AdminRequestFormProps) => {
    return (
        <div className={`flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 ${className ?? ''}`}>
            <div className='w-full max-w-md rounded-2xl border border-slate-700/50 bg-slate-800/50 p-8 shadow-2xl backdrop-blur-xl'>
                <div className='mb-8 text-center'>
                    <h1 className='mb-2 text-3xl font-bold text-white'>Request Admin Access</h1>
                    <p className='text-slate-400'>Submit your request for admin privileges</p>
                </div>

                <Form config={adminRequestFormConfig} />

                <p className='mt-6 text-center text-sm text-slate-400'>
                    Already have an account?{' '}
                    <Link href='/login/admin' className='font-medium text-blue-400 hover:text-blue-300'>
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
};

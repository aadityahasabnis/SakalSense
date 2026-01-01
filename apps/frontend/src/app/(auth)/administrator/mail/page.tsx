'use client';

// =============================================
// Administrator Test Mail Page
// =============================================

import { Form } from '@/components/form/Form';
import { ADMINISTRATOR_API_ROUTES } from '@/constants/routes/administrator.routes';
import { clientApiCall } from '@/lib/http';
import { type FormConfig, type FormValues } from '@/types/form.types';

// sendTestMail: Client-side API call with cookies
const sendTestMail = async (values: FormValues) => {
    return clientApiCall<{ messageId?: string }>({
        method: 'POST',
        url: ADMINISTRATOR_API_ROUTES.mail.test,
        body: {
            recipient: values.recipient,
            cc: values.cc,
            bcc: values.bcc,
            subject: values.subject,
            body: values.body,
        },
    });
};

// Form configuration for test mail
const testMailFormConfig: FormConfig = {
    fields: [
        {
            type: 'heading',
            text: 'Send Test Email',
            description: 'Use this form to send a test email and verify the email service is working correctly.',
        },
        {
            type: 'email',
            name: 'recipient',
            label: 'Recipient Email',
            placeholder: 'Enter recipient email address',
            required: true,
        },
        {
            type: 'email',
            name: 'cc',
            label: 'CC',
            placeholder: 'Optional CC email addresses (comma-separated)',
        },
        {
            type: 'email',
            name: 'bcc',
            label: 'BCC',
            placeholder: 'Optional BCC email addresses (comma-separated)',
        },
        {
            type: 'text',
            name: 'subject',
            label: 'Subject',
            placeholder: 'Enter email subject',
            required: true,
            maxLength: 200,
        },
        {
            type: 'textarea',
            name: 'body',
            label: 'Email Body',
            placeholder: 'Enter email content...',
            required: true,
            rows: 6,
            maxLength: 10000,
        },
    ],
    submit: {
        label: 'Send Test Email',
        loadingLabel: 'Sending...',
        action: sendTestMail,
        onSuccess: () => {
            alert('Test email sent successfully!');
        },
    },
    layout: 'vertical',
};

export default function AdministratorMailPage() {
    return (
        <div className='min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 p-6'>
            <div className='mx-auto max-w-2xl'>
                {/* Header */}
                <div className='mb-8 text-center'>
                    <div className='mb-4 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-2'>
                        <svg className='h-4 w-4 text-amber-400' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                            <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'
                            />
                        </svg>
                        <span className='text-sm font-medium text-amber-300'>Email Service</span>
                    </div>
                    <h1 className='mb-2 text-3xl font-bold text-white'>Test Email</h1>
                    <p className='text-zinc-400'>Send test emails to verify the email service configuration</p>
                </div>

                {/* Form Card */}
                <div className='rounded-2xl border border-zinc-700/50 bg-zinc-800/50 p-6 shadow-xl backdrop-blur-xl'>
                    <Form config={testMailFormConfig} />
                </div>

                {/* Back Link */}
                <div className='mt-6 text-center'>
                    <a href='/administrator' className='text-sm text-zinc-400 hover:text-amber-400 transition-colors'>
                        ← Back to Dashboard
                    </a>
                </div>
            </div>
        </div>
    );
}

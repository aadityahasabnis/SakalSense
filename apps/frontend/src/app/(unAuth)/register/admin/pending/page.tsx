// =============================================
// Admin Request Pending Page
// =============================================

import Link from 'next/link';

import { CheckCircle } from 'lucide-react';

const AdminPendingPage = () => {
    return (
        <div className='flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4'>
            <div className='w-full max-w-md rounded-2xl border border-slate-700/50 bg-slate-800/50 p-8 shadow-2xl backdrop-blur-xl text-center'>
                <div className='mb-6 flex justify-center'>
                    <div className='rounded-full bg-green-500/20 p-4'>
                        <CheckCircle className='h-12 w-12 text-green-400' />
                    </div>
                </div>
                <h1 className='mb-2 text-2xl font-bold text-white'>Request Submitted!</h1>
                <p className='mb-6 text-slate-400'>
                    Your admin access request has been submitted successfully. You will receive an email once your request has been reviewed.
                </p>
                <Link
                    href='/login/admin'
                    className='inline-block rounded-xl bg-slate-700 px-6 py-3 font-medium text-white transition-colors hover:bg-slate-600'
                >
                    Back to Login
                </Link>
            </div>
        </div>
    );
};

export default AdminPendingPage;

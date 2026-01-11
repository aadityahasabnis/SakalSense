'use client';

import { useState } from 'react';

import { getDeviceIcon } from '@/constants/icons';
import { type ISession } from '@/lib/interfaces';
import { terminateSession } from '@/server/actions/auth/session.actions';
import { type StakeholderType } from '@/types/auth.types';

// =============================================
// Session Limit Dialog - Displayed when user exceeds session limit
// =============================================

interface SessionLimitDialogProps {
    role: StakeholderType;
    sessions: Array<ISession>;
    credentials: { email: string; password: string };
    onClose: () => void;
    onSessionTerminated: () => void;
}

// Format relative time for display
const formatRelativeTime = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
};

export const SessionLimitDialog = ({ role, sessions, onClose, onSessionTerminated }: SessionLimitDialogProps) => {
    const [terminatingId, setTerminatingId] = useState<string | undefined>(undefined);
    const [error, setError] = useState<string | undefined>(undefined);

    const handleTerminate = async (sessionId: string) => {
        setTerminatingId(sessionId);
        setError(undefined);

        const response = await terminateSession({ sessionId }, role);

        if (response.success) {
            onSessionTerminated();
            return;
        }

        setError(response.error ?? 'Failed to terminate session');
        setTerminatingId(undefined);
    };

    return (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm'>
            <div className='mx-4 w-full max-w-lg rounded-2xl border border-slate-700/50 bg-slate-800 p-6 shadow-2xl'>
                {/* Header */}
                <div className='mb-6 text-center'>
                    <div className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/20'>
                        <svg className='h-6 w-6 text-amber-400' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                            <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
                            />
                        </svg>
                    </div>
                    <h2 className='text-xl font-semibold text-white'>Session Limit Reached</h2>
                    <p className='mt-2 text-sm text-slate-400'>You have reached your maximum number of active sessions. Terminate an existing session to continue.</p>
                </div>

                {error && <div className='mb-4 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-center text-sm text-red-400'>{error}</div>}

                {/* Sessions List */}
                <div className='mb-6 space-y-3'>
                    {sessions.map((session) => {
                        const Icon = getDeviceIcon(session.device);
                        return (
                            <div key={session.sessionId} className='flex items-center justify-between rounded-xl border border-slate-700 bg-slate-900/50 p-4'>
                                <div className='flex items-center gap-3'>
                                    <Icon className='h-6 w-6 text-slate-400' />
                                    <div>
                                        <p className='text-sm font-medium text-white capitalize'>{session.device}</p>
                                        <p className='text-xs text-slate-400'>
                                            {session.location ?? 'Unknown location'} • Last active: {formatRelativeTime(session.lastActiveAt)}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleTerminate(session.sessionId)}
                                    disabled={terminatingId === session.sessionId}
                                    className='rounded-lg bg-red-500/20 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/30 disabled:cursor-not-allowed disabled:opacity-50'
                                >
                                    {terminatingId === session.sessionId ? 'Terminating...' : 'Terminate'}
                                </button>
                            </div>
                        );
                    })}
                </div>

                <button onClick={onClose} className='w-full rounded-xl border border-slate-600 py-3 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-700/50'>
                    Cancel
                </button>
            </div>
        </div>
    );
};

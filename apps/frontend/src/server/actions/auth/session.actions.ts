'use server';

// =============================================
// Session Server Actions - Authenticated session operations
// =============================================

import { cookies } from 'next/headers';

import { AUTH_COOKIE } from '@/constants/auth.constants';
import { verifyJWT } from '@/lib/auth/jwt';
import { getActiveSessions, invalidateSession } from '@/lib/auth/session';
import { type IApiResponse } from '@/lib/interfaces/api.interfaces';
import { type ISession } from '@/lib/interfaces/auth.interfaces';
import { type StakeholderType } from '@/types/auth.types';

// IGetSessionsResponse: Response for get sessions action
interface IGetSessionsResponse { sessions: Array<ISession> }

// getSessions: Get all active sessions for current user
export const getSessions = async (stakeholder: StakeholderType): Promise<IApiResponse<IGetSessionsResponse>> => {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE[stakeholder])?.value;

    if (!token) return { success: false, error: 'Authentication required' };

    const payload = await verifyJWT(token);
    if (!payload) return { success: false, error: 'Invalid token' };

    const sessions = await getActiveSessions(payload.userId, payload.role);
    return { success: true, data: { sessions } };
};

// ITerminateSessionRequest: Request for terminate session action
interface ITerminateSessionRequest { sessionId: string }

// terminateSession: Terminate a specific session (logout from device)
export const terminateSession = async (params: ITerminateSessionRequest, stakeholder: StakeholderType): Promise<IApiResponse> => {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE[stakeholder])?.value;

    if (!token) return { success: false, error: 'Authentication required' };

    const payload = await verifyJWT(token);
    if (!payload) return { success: false, error: 'Invalid token' };

    if (params.sessionId === payload.sessionId) return { success: false, error: 'Cannot terminate current session. Use logout instead.' };

    await invalidateSession(params.sessionId, payload.userId, payload.role);
    return { success: true, message: 'Session terminated successfully' };
};

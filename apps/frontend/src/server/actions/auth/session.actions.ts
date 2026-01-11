'use server';

// =============================================
// Session Server Actions - Authenticated session operations
// =============================================

import { cookies } from 'next/headers';

import { AUTH_COOKIE } from '@/constants/auth.constants';
import { type IApiResponse } from '@/lib/interfaces/api.interfaces';
import { type ISession } from '@/lib/interfaces/auth.interfaces';
import { createDebugLog } from '@/server/utils/debugLog';
import { verifyJWT } from '@/server/utils/jwt';
import { getActiveSessions, invalidateSession } from '@/server/utils/session';
import { type StakeholderType } from '@/types/auth.types';

// IGetSessionsResponse: Response for get sessions action
interface IGetSessionsResponse { sessions: Array<ISession> }

// getSessions: Get all active sessions for current user
export const getSessions = async (stakeholder: StakeholderType): Promise<IApiResponse<IGetSessionsResponse>> => {
    const start = Date.now();
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE[stakeholder])?.value;

    if (!token) {
        await createDebugLog({ method: 'GET', url: '/auth/sessions', requestBody: { stakeholder }, responseBody: { error: 'No token' }, status: 401, duration: Date.now() - start, stakeholder });
        return { success: false, error: 'Authentication required' };
    }

    const payload = await verifyJWT(token);
    if (!payload) {
        await createDebugLog({ method: 'GET', url: '/auth/sessions', requestBody: { stakeholder }, responseBody: { error: 'Invalid token' }, status: 401, duration: Date.now() - start, stakeholder });
        return { success: false, error: 'Invalid token' };
    }

    // Use email from JWT for session operations
    const sessions = await getActiveSessions(payload.email, payload.role);

    await createDebugLog({ method: 'GET', url: '/auth/sessions', requestBody: { stakeholder }, responseBody: { count: sessions.length }, status: 200, duration: Date.now() - start, stakeholder, stakeholderId: payload.userId });
    return { success: true, data: { sessions } };
};

// ITerminateSessionRequest: Request for terminate session action
interface ITerminateSessionRequest { sessionId: string }

// terminateSession: Terminate a specific session (logout from device)
export const terminateSession = async (params: ITerminateSessionRequest, stakeholder: StakeholderType): Promise<IApiResponse> => {
    const start = Date.now();
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE[stakeholder])?.value;

    if (!token) {
        await createDebugLog({ method: 'DELETE', url: '/auth/sessions', requestBody: { sessionId: params.sessionId, stakeholder }, responseBody: { error: 'No token' }, status: 401, duration: Date.now() - start, stakeholder });
        return { success: false, error: 'Authentication required' };
    }

    const payload = await verifyJWT(token);
    if (!payload) {
        await createDebugLog({ method: 'DELETE', url: '/auth/sessions', requestBody: { sessionId: params.sessionId, stakeholder }, responseBody: { error: 'Invalid token' }, status: 401, duration: Date.now() - start, stakeholder });
        return { success: false, error: 'Invalid token' };
    }

    if (params.sessionId === payload.sessionId) {
        await createDebugLog({ method: 'DELETE', url: '/auth/sessions', requestBody: { sessionId: params.sessionId, stakeholder }, responseBody: { error: 'Cannot terminate current' }, status: 400, duration: Date.now() - start, stakeholder, stakeholderId: payload.userId });
        return { success: false, error: 'Cannot terminate current session. Use logout instead.' };
    }

    // Use email from JWT for session invalidation
    await invalidateSession(params.sessionId, payload.email, payload.role);

    await createDebugLog({ method: 'DELETE', url: '/auth/sessions', requestBody: { sessionId: params.sessionId, stakeholder }, responseBody: { success: true }, status: 200, duration: Date.now() - start, stakeholder, stakeholderId: payload.userId });
    return { success: true, message: 'Session terminated successfully' };
};

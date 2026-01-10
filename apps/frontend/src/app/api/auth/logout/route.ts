// =============================================
// Logout API Route - Session invalidation endpoint
// =============================================

import { type NextRequest, NextResponse } from 'next/server';

import { AUTH_COOKIE } from '@/constants/auth.constants';
import { HTTP_STATUS } from '@/constants/http.constants';
import { verifyJWT } from '@/lib/auth/jwt';
import { invalidateSession } from '@/lib/auth/session';
import { type IApiResponse } from '@/lib/interfaces/api.interfaces';
import { type StakeholderType } from '@/types/auth.types';

export const POST = async (req: NextRequest): Promise<NextResponse<IApiResponse>> => {
    try {
        const { stakeholder }: { stakeholder: StakeholderType } = await req.json();

        if (!stakeholder) {
            return NextResponse.json({ success: false, error: 'Stakeholder is required' }, { status: HTTP_STATUS.BAD_REQUEST });
        }

        const cookieName = AUTH_COOKIE[stakeholder];
        const token = req.cookies.get(cookieName)?.value;

        if (token) {
            const payload = await verifyJWT(token);
            if (payload) await invalidateSession(payload.sessionId, payload.userId, payload.role);
        }

        const response = NextResponse.json<IApiResponse>({ success: true, message: 'Logged out successfully' });
        response.cookies.delete(cookieName);
        return response;
    } catch (error) {
        console.error('[API/auth/logout]', error);
        return NextResponse.json({ success: false, error: 'An unexpected error occurred' }, { status: HTTP_STATUS.INTERNAL_SERVER_ERROR });
    }
};

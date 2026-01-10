// =============================================
// Login API Route - Authentication endpoint
// =============================================

import { type NextRequest, NextResponse } from 'next/server';

import { AUTH_COOKIE, COOKIE_CONFIG } from '@/constants/auth.constants';
import { HTTP_STATUS } from '@/constants/http.constants';
import { RATE_LIMIT_AUTH } from '@/constants/rate-limit.constants';
import { signJWT } from '@/lib/auth/jwt';
import { verifyPassword } from '@/lib/auth/password';
import { createSession } from '@/lib/auth/session';
import { type IApiResponse } from '@/lib/interfaces/api.interfaces';
import { type ILoginRequest, type ILoginResponse } from '@/lib/interfaces/auth.interfaces';
import { consumeRateLimit } from '@/lib/rate-limit/service';
import { detectDevice, getClientIP } from '@/lib/utils/device';
import { prisma } from '@/server/db/prisma';
import { type StakeholderType } from '@/types/auth.types';

// getEntityByEmail: Common lookup for any stakeholder type
const getEntityByEmail = async (email: string, stakeholder: StakeholderType) => {
    const normalized = email.toLowerCase().trim();
    switch (stakeholder) {
        case 'USER':
            return prisma.user.findUnique({ where: { email: normalized } });
        case 'ADMIN':
            return prisma.admin.findUnique({ where: { email: normalized } });
        case 'ADMINISTRATOR':
            return prisma.administrator.findUnique({ where: { email: normalized } });
    }
};

export const POST = async (req: NextRequest): Promise<NextResponse<IApiResponse<ILoginResponse>>> => {
    const ip = getClientIP(req.headers);
    const userAgent = req.headers.get('user-agent') ?? '';

    // Rate limiting
    const rateLimitResult = await consumeRateLimit(ip, RATE_LIMIT_AUTH);
    if (!rateLimitResult.allowed) {
        return NextResponse.json(
            { success: false, error: 'Too many login attempts. Please try again later.' },
            { status: HTTP_STATUS.TOO_MANY_REQUESTS, headers: { 'Retry-After': String(rateLimitResult.retryAfter ?? 60) } }
        );
    }

    try {
        const { email, password, stakeholder }: ILoginRequest = await req.json();

        if (!email || !password || !stakeholder) return NextResponse.json({ success: false, error: 'Email, password, and stakeholder are required' }, { status: HTTP_STATUS.BAD_REQUEST });

        const entity = await getEntityByEmail(email, stakeholder);
        if (!entity || !(await verifyPassword(password, entity.password))) return NextResponse.json({ success: false, error: 'Invalid email or password' }, { status: HTTP_STATUS.UNAUTHORIZED });
        if (!entity.isActive) return NextResponse.json({ success: false, error: 'Account is deactivated' }, { status: HTTP_STATUS.FORBIDDEN });

        const { session, limitExceeded, activeSessions } = await createSession(entity.id, stakeholder, detectDevice(userAgent), ip, userAgent);

        if (limitExceeded) {
            return NextResponse.json({
                success: false,
                error: 'Session limit exceeded. Please logout from another device.',
                data: { sessionLimitExceeded: true, activeSessions },
            }, { status: HTTP_STATUS.CONFLICT });
        }

        const token = await signJWT({ userId: entity.id, fullName: entity.fullName, avatarLink: entity.avatarLink ?? undefined, role: stakeholder, sessionId: session.sessionId });

        const response = NextResponse.json<IApiResponse<ILoginResponse>>({
            success: true,
            data: { user: { id: entity.id, fullName: entity.fullName, email: entity.email, avatarLink: entity.avatarLink ?? undefined } },
        });

        response.cookies.set(AUTH_COOKIE[stakeholder], token, COOKIE_CONFIG);
        return response;
    } catch (error) {
        console.error('[API/auth/login]', error);
        return NextResponse.json({ success: false, error: 'An unexpected error occurred' }, { status: HTTP_STATUS.INTERNAL_SERVER_ERROR });
    }
};

// =============================================
// Register API Route - User registration endpoint
// =============================================

import { type NextRequest, NextResponse } from 'next/server';

import { AUTH_COOKIE, COOKIE_CONFIG } from '@/constants/auth.constants';
import { HTTP_STATUS } from '@/constants/http.constants';
import { RATE_LIMIT_AUTH } from '@/constants/rate-limit.constants';
import { signJWT } from '@/lib/auth/jwt';
import { hashPassword } from '@/lib/auth/password';
import { createSession } from '@/lib/auth/session';
import { type IApiResponse } from '@/lib/interfaces/api.interfaces';
import { type ILoginResponse, type IUserRegisterRequest } from '@/lib/interfaces/auth.interfaces';
import { consumeRateLimit } from '@/lib/rate-limit/service';
import { prisma } from '@/server/db/prisma';

// Detect device type from user agent
const detectDevice = (userAgent: string): 'mobile' | 'tablet' | 'laptop' | 'desktop' | 'unknown' => {
    const ua = userAgent.toLowerCase();
    if (/mobile|android|iphone|ipod|blackberry|windows phone/i.test(ua)) return 'mobile';
    if (/tablet|ipad/i.test(ua)) return 'tablet';
    if (/macintosh|windows|linux/i.test(ua)) return 'desktop';
    return 'unknown';
};

export const POST = async (req: NextRequest): Promise<NextResponse<IApiResponse<ILoginResponse>>> => {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';

    // Rate limiting
    const rateLimitResult = await consumeRateLimit(ip, RATE_LIMIT_AUTH);
    if (!rateLimitResult.allowed) {
        return NextResponse.json(
            { success: false, error: 'Too many requests. Please try again later.' },
            { status: HTTP_STATUS.TOO_MANY_REQUESTS, headers: { 'Retry-After': String(rateLimitResult.retryAfter ?? 60) } }
        );
    }

    try {
        const body: IUserRegisterRequest = await req.json();
        const { fullName, email, password, mobile } = body;

        if (!fullName || !email || !password) {
            return NextResponse.json({ success: false, error: 'Full name, email, and password are required' }, { status: HTTP_STATUS.BAD_REQUEST });
        }

        if (password.length < 8) {
            return NextResponse.json({ success: false, error: 'Password must be at least 8 characters' }, { status: HTTP_STATUS.BAD_REQUEST });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });

        if (existingUser) {
            return NextResponse.json({ success: false, error: 'Email is already registered' }, { status: HTTP_STATUS.CONFLICT });
        }

        const user = await prisma.user.create({
            data: {
                fullName: fullName.trim(),
                email: normalizedEmail,
                password: await hashPassword(password),
                mobile: mobile?.trim(),
            },
        });

        const device = detectDevice(req.headers.get('user-agent') ?? '');
        const { session } = await createSession(user.id, 'USER', device, ip, req.headers.get('user-agent') ?? '');

        const token = await signJWT({
            userId: user.id,
            fullName: user.fullName,
            avatarLink: user.avatarLink ?? undefined,
            role: 'USER',
            sessionId: session.sessionId,
        });

        const response = NextResponse.json<IApiResponse<ILoginResponse>>({
            success: true,
            data: { user: { id: user.id, fullName: user.fullName, email: user.email, avatarLink: user.avatarLink ?? undefined } },
        });

        response.cookies.set(AUTH_COOKIE.USER, token, COOKIE_CONFIG);
        return response;
    } catch (error) {
        console.error('[API/auth/register]', error);
        return NextResponse.json({ success: false, error: 'An unexpected error occurred' }, { status: HTTP_STATUS.INTERNAL_SERVER_ERROR });
    }
};

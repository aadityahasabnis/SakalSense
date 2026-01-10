// =============================================
// Forgot Password API Route - Request password reset token
// =============================================

import { randomBytes } from 'crypto';

import { type NextRequest, NextResponse } from 'next/server';

import { PASSWORD_RESET_TTL, RESET_TOKEN_PREFIX } from '@/constants/auth.constants';
import { HTTP_STATUS } from '@/constants/http.constants';
import { RATE_LIMIT_AUTH } from '@/constants/rate-limit.constants';
import { type IApiResponse } from '@/lib/interfaces/api.interfaces';
import { type IForgotPasswordRequest } from '@/lib/interfaces/auth.interfaces';
import { consumeRateLimit } from '@/lib/rate-limit/service';
import { prisma } from '@/server/db/prisma';
import { getRedis } from '@/server/db/redis';
import { type StakeholderType } from '@/types/auth.types';

// Redis key for reset token
const resetTokenKey = (token: string): string => `password_reset:${token}`;

// Get entity by email for any stakeholder type
const getEntityByEmail = async (email: string, stakeholder: StakeholderType) => {
    const normalizedEmail = email.toLowerCase().trim();
    switch (stakeholder) {
        case 'USER':
            return prisma.user.findUnique({ where: { email: normalizedEmail } });
        case 'ADMIN':
            return prisma.admin.findUnique({ where: { email: normalizedEmail } });
        case 'ADMINISTRATOR':
            return prisma.administrator.findUnique({ where: { email: normalizedEmail } });
    }
};

export const POST = async (req: NextRequest): Promise<NextResponse<IApiResponse<{ token?: string }>>> => {
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
        const body: IForgotPasswordRequest = await req.json();
        const { email, stakeholder } = body;

        if (!email || !stakeholder) {
            return NextResponse.json({ success: false, error: 'Email and stakeholder are required' }, { status: HTTP_STATUS.BAD_REQUEST });
        }

        const entity = await getEntityByEmail(email, stakeholder);

        // Always return success to prevent email enumeration (security best practice)
        if (!entity?.isActive) {
            return NextResponse.json({ success: true, message: 'If the email exists, a password reset link has been sent' });
        }

        // Generate secure token with role prefix
        const tokenBytes = randomBytes(32).toString('hex');
        const token = `${RESET_TOKEN_PREFIX[stakeholder]}_${tokenBytes}`;

        // Store token data in Redis
        const redis = await getRedis();
        await redis.setEx(resetTokenKey(token), PASSWORD_RESET_TTL, JSON.stringify({ userId: entity.id, email: entity.email, stakeholder }));

        // TODO: Send email with reset link (integrate with mail service)
        console.log(`[Password Reset] Token generated for ${email}: ${token}`);

        return NextResponse.json({ success: true, message: 'If the email exists, a password reset link has been sent' });
    } catch (error) {
        console.error('[API/auth/forgot-password]', error);
        return NextResponse.json({ success: false, error: 'An unexpected error occurred' }, { status: HTTP_STATUS.INTERNAL_SERVER_ERROR });
    }
};

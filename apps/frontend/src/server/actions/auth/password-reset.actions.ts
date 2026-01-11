'use server';
// =============================================
// Password Reset Server Actions - Forgot and reset password
// =============================================

import { randomBytes } from 'crypto';

import { headers } from 'next/headers';

import { PASSWORD_RESET_TTL, PREFIX_TO_STAKEHOLDER, RESET_TOKEN_PREFIX } from '@/constants/auth.constants';
import { RATE_LIMIT_AUTH } from '@/constants/rate-limit.constants';
import { BASE_URL } from '@/env';
import { prisma } from '@/server/db/prisma';
import { getRedis } from '@/server/db/redis';
import { createDebugLog } from '@/server/utils/debugLog';
import { getClientIP } from '@/server/utils/device';
import { sendPasswordResetEmail } from '@/server/utils/mail';
import { hashPassword } from '@/server/utils/password';
import { consumeRateLimit } from '@/server/utils/rate-limit';
import { invalidateAllSessions } from '@/server/utils/session';
import { type StakeholderType } from '@/types/auth.types';

// Redis key for reset token
const resetTokenKey = (token: string): string => `password_reset:${token}`;

// Token data structure
interface IResetTokenData {
    email: string;
    stakeholder: StakeholderType;
}

// =============================================
// Forgot Password Action
// =============================================

interface IForgotPasswordRequest {
    email: string;
    stakeholder: StakeholderType;
}

interface IForgotPasswordResponse {
    success: boolean;
    error?: string;
    message?: string;
}

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

export const forgotPasswordAction = async (params: IForgotPasswordRequest): Promise<IForgotPasswordResponse> => {
    const start = Date.now();
    const { email, stakeholder } = params;
    const h = await headers();
    const ip = getClientIP(h);

    // Rate limiting
    const rateLimitResult = await consumeRateLimit(ip, RATE_LIMIT_AUTH);
    if (!rateLimitResult.allowed) {
        await createDebugLog({ method: 'POST', url: '/auth/forgot-password', requestBody: { email, stakeholder }, responseBody: { error: 'Rate limited' }, status: 429, duration: Date.now() - start, stakeholder });
        return { success: false, error: 'Too many requests. Please try again later.' };
    }

    // Validation
    if (!email || !stakeholder) {
        await createDebugLog({ method: 'POST', url: '/auth/forgot-password', requestBody: { email, stakeholder }, responseBody: { error: 'Validation failed' }, status: 400, duration: Date.now() - start, stakeholder });
        return { success: false, error: 'Email and stakeholder are required' };
    }

    try {
        const entity = await getEntityByEmail(email, stakeholder);

        // Always return success to prevent email enumeration (security best practice)
        if (!entity?.isActive) {
            await createDebugLog({ method: 'POST', url: '/auth/forgot-password', requestBody: { email, stakeholder }, responseBody: { message: 'Email not found (hidden)' }, status: 200, duration: Date.now() - start, stakeholder });
            return { success: true, message: 'If the email exists, a password reset link has been sent' };
        }

        // Generate secure token with role prefix
        const tokenBytes = randomBytes(32).toString('hex');
        const token = `${RESET_TOKEN_PREFIX[stakeholder]}_${tokenBytes}`;

        // Store token data in Redis (email-based)
        const redis = await getRedis();
        await redis.setEx(resetTokenKey(token), PASSWORD_RESET_TTL, JSON.stringify({ email: entity.email, stakeholder }));

        // Send password reset email with Next.js BASE_URL
        const resetLink = `${BASE_URL}/reset-password?token=${token}`;
        await sendPasswordResetEmail(entity.email, { recipientName: entity.fullName, resetLink, expiresIn: '1 hour' });

        await createDebugLog({ method: 'POST', url: '/auth/forgot-password', requestBody: { email, stakeholder }, responseBody: { success: true }, status: 200, duration: Date.now() - start, stakeholder, stakeholderId: entity.id });
        return { success: true, message: 'If the email exists, a password reset link has been sent' };
    } catch (error) {
        console.error('[forgotPasswordAction]', error);
        await createDebugLog({ method: 'POST', url: '/auth/forgot-password', requestBody: { email, stakeholder }, responseBody: { error: 'Server error' }, status: 500, duration: Date.now() - start, stakeholder, errorMessage: error instanceof Error ? error.message : 'Unknown' });
        return { success: false, error: 'An unexpected error occurred' };
    }
};

// =============================================
// Reset Password Action
// =============================================

interface IResetPasswordRequest {
    token: string;
    newPassword: string;
}

interface IResetPasswordResponse {
    success: boolean;
    error?: string;
    message?: string;
}

export const resetPasswordAction = async (params: IResetPasswordRequest): Promise<IResetPasswordResponse> => {
    const start = Date.now();
    const { token, newPassword } = params;

    // Validation
    if (!token || !newPassword) {
        await createDebugLog({ method: 'POST', url: '/auth/reset-password', requestBody: { token: token?.slice(0, 10) }, responseBody: { error: 'Validation failed' }, status: 400, duration: Date.now() - start });
        return { success: false, error: 'Token and new password are required' };
    }
    if (newPassword.length < 8) {
        await createDebugLog({ method: 'POST', url: '/auth/reset-password', requestBody: { token: token.slice(0, 10) }, responseBody: { error: 'Password too short' }, status: 400, duration: Date.now() - start });
        return { success: false, error: 'Password must be at least 8 characters' };
    }

    try {
        // Extract stakeholder from token prefix
        const [prefix] = token.split('_');
        const stakeholder = prefix ? PREFIX_TO_STAKEHOLDER[prefix as keyof typeof PREFIX_TO_STAKEHOLDER] : undefined;

        if (!stakeholder) {
            await createDebugLog({ method: 'POST', url: '/auth/reset-password', requestBody: { token: token.slice(0, 10) }, responseBody: { error: 'Invalid token' }, status: 400, duration: Date.now() - start });
            return { success: false, error: 'Invalid reset token' };
        }

        // Validate token in Redis
        const redis = await getRedis();
        const tokenData = await redis.get(resetTokenKey(token));

        if (!tokenData) {
            await createDebugLog({ method: 'POST', url: '/auth/reset-password', requestBody: { token: token.slice(0, 10) }, responseBody: { error: 'Token expired' }, status: 401, duration: Date.now() - start, stakeholder });
            return { success: false, error: 'Reset token has expired or is invalid' };
        }

        const { email, stakeholder: tokenStakeholder }: IResetTokenData = JSON.parse(tokenData);

        if (tokenStakeholder !== stakeholder) {
            await createDebugLog({ method: 'POST', url: '/auth/reset-password', requestBody: { token: token.slice(0, 10) }, responseBody: { error: 'Token mismatch' }, status: 400, duration: Date.now() - start, stakeholder });
            return { success: false, error: 'Invalid reset token' };
        }

        // Hash new password
        const hashedPassword = await hashPassword(newPassword);

        // Update password in database
        switch (stakeholder) {
            case 'USER':
                await prisma.user.update({ where: { email }, data: { password: hashedPassword } });
                break;
            case 'ADMIN':
                await prisma.admin.update({ where: { email }, data: { password: hashedPassword } });
                break;
            case 'ADMINISTRATOR':
                await prisma.administrator.update({ where: { email }, data: { password: hashedPassword } });
                break;
        }

        // Invalidate all sessions using email
        await invalidateAllSessions(email, stakeholder);

        // Delete the used token
        await redis.del(resetTokenKey(token));

        await createDebugLog({ method: 'POST', url: '/auth/reset-password', requestBody: { token: token.slice(0, 10) }, responseBody: { success: true }, status: 200, duration: Date.now() - start, stakeholder });
        return { success: true, message: 'Password has been reset successfully' };
    } catch (error) {
        console.error('[resetPasswordAction]', error);
        await createDebugLog({ method: 'POST', url: '/auth/reset-password', requestBody: { token: token?.slice(0, 10) }, responseBody: { error: 'Server error' }, status: 500, duration: Date.now() - start, errorMessage: error instanceof Error ? error.message : 'Unknown' });
        return { success: false, error: 'An unexpected error occurred' };
    }
};

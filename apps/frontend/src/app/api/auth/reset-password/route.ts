// =============================================
// Reset Password API Route - Set new password with token
// =============================================

import { type NextRequest, NextResponse } from 'next/server';

import { PREFIX_TO_STAKEHOLDER } from '@/constants/auth.constants';
import { HTTP_STATUS } from '@/constants/http.constants';
import { hashPassword } from '@/lib/auth/password';
import { invalidateAllSessions } from '@/lib/auth/session';
import { type IApiResponse } from '@/lib/interfaces/api.interfaces';
import { type IResetPasswordRequest } from '@/lib/interfaces/auth.interfaces';
import { prisma } from '@/server/db/prisma';
import { getRedis } from '@/server/db/redis';
import { type StakeholderType } from '@/types/auth.types';

// Redis key for reset token
const resetTokenKey = (token: string): string => `password_reset:${token}`;

// Token data structure
interface IResetTokenData {
    userId: string;
    email: string;
    stakeholder: StakeholderType;
}

export const POST = async (req: NextRequest): Promise<NextResponse<IApiResponse>> => {
    try {
        const body: IResetPasswordRequest = await req.json();
        const { token, newPassword } = body;

        if (!token || !newPassword) {
            return NextResponse.json({ success: false, error: 'Token and new password are required' }, { status: HTTP_STATUS.BAD_REQUEST });
        }

        if (newPassword.length < 8) {
            return NextResponse.json({ success: false, error: 'Password must be at least 8 characters' }, { status: HTTP_STATUS.BAD_REQUEST });
        }

        // Extract stakeholder from token prefix
        const [prefix] = token.split('_');
        const stakeholder = prefix ? PREFIX_TO_STAKEHOLDER[prefix as keyof typeof PREFIX_TO_STAKEHOLDER] : undefined;

        if (!stakeholder) {
            return NextResponse.json({ success: false, error: 'Invalid reset token' }, { status: HTTP_STATUS.BAD_REQUEST });
        }

        // Validate token in Redis
        const redis = await getRedis();
        const tokenData = await redis.get(resetTokenKey(token));

        if (!tokenData) {
            return NextResponse.json({ success: false, error: 'Reset token has expired or is invalid' }, { status: HTTP_STATUS.BAD_REQUEST });
        }

        const { userId, stakeholder: tokenStakeholder }: IResetTokenData = JSON.parse(tokenData);

        if (tokenStakeholder !== stakeholder) {
            return NextResponse.json({ success: false, error: 'Invalid reset token' }, { status: HTTP_STATUS.BAD_REQUEST });
        }

        // Hash new password
        const hashedPassword = await hashPassword(newPassword);

        // Update password in database
        switch (stakeholder) {
            case 'USER':
                await prisma.user.update({ where: { id: userId }, data: { password: hashedPassword } });
                break;
            case 'ADMIN':
                await prisma.admin.update({ where: { id: userId }, data: { password: hashedPassword } });
                break;
            case 'ADMINISTRATOR':
                await prisma.administrator.update({ where: { id: userId }, data: { password: hashedPassword } });
                break;
        }

        // Invalidate all sessions (force re-login)
        await invalidateAllSessions(userId, stakeholder);

        // Delete the used token
        await redis.del(resetTokenKey(token));

        return NextResponse.json({ success: true, message: 'Password has been reset successfully' });
    } catch (error) {
        console.error('[API/auth/reset-password]', error);
        return NextResponse.json({ success: false, error: 'An unexpected error occurred' }, { status: HTTP_STATUS.INTERNAL_SERVER_ERROR });
    }
};

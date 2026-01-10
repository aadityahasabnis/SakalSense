'use server';

// =============================================
// Password Server Actions - Authenticated password operations
// =============================================

import { cookies } from 'next/headers';

import { AUTH_COOKIE } from '@/constants/auth.constants';
import { verifyJWT } from '@/lib/auth/jwt';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { type IApiResponse } from '@/lib/interfaces/api.interfaces';
import { type IUpdatePasswordRequest } from '@/lib/interfaces/auth.interfaces';
import { prisma } from '@/server/db/prisma';
import { type StakeholderType } from '@/types/auth.types';

// IUpdatePasswordResponse: Response for password update action
interface IUpdatePasswordResponse { message?: string }

// updatePassword: Update authenticated user's password
export const updatePassword = async (params: IUpdatePasswordRequest, stakeholder: StakeholderType): Promise<IApiResponse<IUpdatePasswordResponse>> => {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE[stakeholder])?.value;

    if (!token) return { success: false, error: 'Authentication required' };

    const payload = await verifyJWT(token);
    if (!payload) return { success: false, error: 'Invalid token' };

    const { currentPassword, newPassword } = params;

    if (newPassword.length < 8) return { success: false, error: 'New password must be at least 8 characters' };

    // Get current entity
    const getEntity = async () => {
        switch (stakeholder) {
            case 'USER':
                return prisma.user.findUnique({ where: { id: payload.userId } });
            case 'ADMIN':
                return prisma.admin.findUnique({ where: { id: payload.userId } });
            case 'ADMINISTRATOR':
                return prisma.administrator.findUnique({ where: { id: payload.userId } });
        }
    };

    const entity = await getEntity();
    if (!entity) return { success: false, error: 'User not found' };

    if (!(await verifyPassword(currentPassword, entity.password))) return { success: false, error: 'Current password is incorrect' };
    if (await verifyPassword(newPassword, entity.password)) return { success: false, error: 'New password must be different from current password' };

    const hashedPassword = await hashPassword(newPassword);

    // Update password
    switch (stakeholder) {
        case 'USER':
            await prisma.user.update({ where: { id: payload.userId }, data: { password: hashedPassword } });
            break;
        case 'ADMIN':
            await prisma.admin.update({ where: { id: payload.userId }, data: { password: hashedPassword } });
            break;
        case 'ADMINISTRATOR':
            await prisma.administrator.update({ where: { id: payload.userId }, data: { password: hashedPassword } });
            break;
    }

    return { success: true, data: { message: 'Password updated successfully' } };
};

// =============================================
// Admin Authentication Controller
// Handles login, invite-only registration, logout for ADMIN
// =============================================

import { STAKEHOLDER } from '@/constants/auth.constants.js';
import { AdminModel, type IAdminDocument } from '../../models/index.js';
import { createAuthController } from './base.auth.controller.js';
import { type IAdminRegisterRequest } from '@/lib/interfaces/auth.interfaces.js';

// TODO: Store invite codes in database with expiry in production
const VALID_INVITE_CODES = new Set(['ADMIN-INVITE-2024']);

export const adminAuthController = createAuthController<IAdminDocument>({
    role: STAKEHOLDER.ADMIN,
    model: AdminModel,
    supportsRegistration: true,

    validateRegistration: (body) => {
        const { fullName, email, password, inviteCode } = body as IAdminRegisterRequest;
        if (!fullName || !email || !password || !inviteCode) {
            return { valid: false, error: 'All fields required including invite code' };
        }
        if (!VALID_INVITE_CODES.has(inviteCode)) {
            return { valid: false, error: 'Invalid invite code' };
        }
        return { valid: true };
    },

    createDocument: async (body, hashedPassword) => {
        const { fullName, email } = body as IAdminRegisterRequest;
        return AdminModel.create({
            fullName,
            email: email.toLowerCase(),
            password: hashedPassword,
        });
    },
});

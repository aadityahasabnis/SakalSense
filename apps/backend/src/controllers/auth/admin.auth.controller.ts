// =============================================
// Admin Authentication Controller
// Handles login, invite-only registration, logout for ADMIN
// =============================================

import { STAKEHOLDER, type IAdminRegisterRequest } from '@sakalsense/core';

import { AdminModel, type IAdminDocument } from '../../models';
import { createAuthController } from './base.auth.controller';

// TODO: Store invite codes in database with expiry in production
const VALID_INVITE_CODES = new Set(['ADMIN-INVITE-2024']);

const controller = createAuthController<IAdminDocument>({
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

export const { login, register, logout, getSessions, terminateSession, updatePassword } = controller;

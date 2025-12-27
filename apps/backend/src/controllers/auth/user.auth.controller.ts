// =============================================
// User Authentication Controller
// Handles login, registration, logout, session management for USER
// =============================================

import { STAKEHOLDER, type IUserRegisterRequest } from 'sakalsense-core';

import { UserModel, type IUserDocument } from '../../models/index.js';
import { createAuthController } from './base.auth.controller.js';

const controller = createAuthController<IUserDocument>({
    role: STAKEHOLDER.USER,
    model: UserModel,
    supportsRegistration: true,

    validateRegistration: (body) => {
        const { fullName, email, password } = body as IUserRegisterRequest;
        if (!fullName || !email || !password) {
            return { valid: false, error: 'Full name, email, and password required' };
        }
        return { valid: true };
    },

    createDocument: async (body, hashedPassword) => {
        const { fullName, email, mobile } = body as IUserRegisterRequest;
        return UserModel.create({
            fullName,
            email: email.toLowerCase(),
            password: hashedPassword,
            mobile,
        });
    },
});

export const { login, register, logout, getSessions, terminateSession, updatePassword } = controller;

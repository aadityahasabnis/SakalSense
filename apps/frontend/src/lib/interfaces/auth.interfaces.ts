// =============================================
// Auth Interfaces - JWT, Session, and API structures
// =============================================

import { type DeviceType, type StakeholderType } from '@/types/auth.types';

// JWT payload embedded in token
export interface IJWTPayload {
    userId: string;
    fullName: string;
    avatarLink?: string;
    role: StakeholderType;
    sessionId: string;
}

// Redis session structure
export interface ISession {
    sessionId: string;
    userId: string;
    role: StakeholderType;
    device: DeviceType;
    ip: string;
    location?: string;
    userAgent: string;
    createdAt: string;
    lastActiveAt: string;
}

// Login request (common for all stakeholders)
export interface ILoginRequest {
    email: string;
    password: string;
    stakeholder: StakeholderType;
}

// Login user data
export interface ILoginUserData {
    id: string;
    fullName: string;
    email: string;
    avatarLink?: string;
}

// Login response with optional session conflict data
export interface ILoginResponse {
    user?: ILoginUserData;
    sessionLimitExceeded?: boolean;
    activeSessions?: Array<ISession>;
}

// User registration (public signup)
export interface IUserRegisterRequest {
    fullName: string;
    email: string;
    password: string;
    mobile?: string;
}

// Admin registration (invite-only)
export interface IAdminRegisterRequest {
    fullName: string;
    email: string;
    password: string;
    inviteCode: string;
}

// Update password request (authenticated)
export interface IUpdatePasswordRequest {
    currentPassword: string;
    newPassword: string;
}

// Forgot password request
export interface IForgotPasswordRequest {
    email: string;
    stakeholder: StakeholderType;
}

// Reset password request
export interface IResetPasswordRequest {
    token: string;
    newPassword: string;
}

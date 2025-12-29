// =============================================
// Auth Interfaces - JWT, Session, and API structures
// =============================================

import { type DeviceType, type StakeholderType } from './auth.types';

// JWT payload embedded in token
export interface IJWTPayload {
    userId: string;
    fullName: string;
    avatarLink: string | null;
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
    location: string | null;
    userAgent: string;
    createdAt: string;
    lastActiveAt: string;
}

// Login request (common for all stakeholders)
export interface ILoginRequest {
    email: string;
    password: string;
    [key: string]: unknown;
}

// Login response with optional session conflict data
export interface ILoginResponse {
    user: { id: string; fullName: string; email: string; avatarLink: string | null };
    sessionLimitExceeded?: boolean;
    activeSessions?: Array<ISession>;
}

// User registration (public signup)
export interface IUserRegisterRequest {
    fullName: string;
    email: string;
    password: string;
    mobile?: string;
    [key: string]: unknown;
}

// Admin registration (invite-only)
export interface IAdminRegisterRequest {
    fullName: string;
    email: string;
    password: string;
    inviteCode: string;
    [key: string]: unknown;
}

// Update password request (authenticated)
export interface IUpdatePasswordRequest {
    currentPassword: string;
    newPassword: string;
}

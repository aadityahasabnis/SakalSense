'use server';

// =============================================
// Auth Utilities - Server-side authentication helpers
// =============================================

import { cookies } from 'next/headers';

import { AUTH_COOKIE, type IJWTPayload, type StakeholderType } from '@sakalsense/core';

// =============================================
// Types
// =============================================

export interface ICurrentUser extends IJWTPayload {
    stakeholder: StakeholderType;
}

// =============================================
// JWT Decoding (for display purposes - backend verifies on each API call)
// =============================================

const decodeJWT = (token: string): IJWTPayload | null => {
    try {
        // JWT format: header.payload.signature
        const parts = token.split('.');
        if (parts.length !== 3) return null;

        // Decode the payload (base64url -> JSON)
        const payloadPart = parts[1];
        if (!payloadPart) return null;
        const payload = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
        const decoded = Buffer.from(payload, 'base64').toString('utf-8');
        return JSON.parse(decoded) as IJWTPayload;
    } catch {
        return null;
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// Server Actions
// =============================================
// Get Current User
// =============================================

export const getCurrentUser = async (stakeholder: StakeholderType): Promise<ICurrentUser | null> => {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE[stakeholder])?.value;

    if (!token) return null;

    const payload = decodeJWT(token);
    if (!payload) return null;

    return { ...payload, stakeholder };
};

// =============================================
// Get Cookie Info
// =============================================

export const getCookieInfo = async (stakeholder: StakeholderType): Promise<{ name: string; value: string | null; decoded: IJWTPayload | null }> => {
    const cookieStore = await cookies();
    const cookieName = AUTH_COOKIE[stakeholder];
    const token = cookieStore.get(cookieName)?.value ?? null;

    return {
        name: cookieName,
        value: token ? `${token.slice(0, 20)}...${token.slice(-10)}` : null,
        decoded: token ? decodeJWT(token) : null,
    };
};

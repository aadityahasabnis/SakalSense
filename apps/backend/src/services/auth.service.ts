// =============================================
// Auth Service - JWT, password hashing, and cookie handling
// =============================================

import * as argon2 from 'argon2';
import jwt from 'jsonwebtoken';

import { type Response } from 'express';

import { AUTH_COOKIE, COOKIE_CONFIG, SESSION_TTL, type IJWTPayload, type StakeholderType } from 'sakalsense-core';

import { JWT_SECRET } from '../config';

// Password hashing using Argon2id
export const hashPassword = async (password: string): Promise<string> => argon2.hash(password, { type: argon2.argon2id });

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => argon2.verify(hash, password);

// JWT generation and verification
export const generateJWT = (payload: IJWTPayload): string => jwt.sign(payload, JWT_SECRET, { expiresIn: SESSION_TTL });

export const verifyJWT = (token: string): IJWTPayload | null => {
    try {
        return jwt.verify(token, JWT_SECRET) as IJWTPayload;
    } catch {
        return null;
    }
};

// Cookie operations
export const setAuthCookie = (res: Response, token: string, role: StakeholderType): void => {
    res.cookie(AUTH_COOKIE[role], token, COOKIE_CONFIG);
};

export const clearAuthCookie = (res: Response, role: StakeholderType): void => {
    res.clearCookie(AUTH_COOKIE[role], { path: '/' });
};

// Extract token from request cookies
export const getTokenFromCookies = (cookies: Record<string, string>, role: StakeholderType): string | null => cookies[AUTH_COOKIE[role]] ?? null;

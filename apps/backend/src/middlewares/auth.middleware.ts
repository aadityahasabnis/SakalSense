// =============================================
// Auth Middleware - JWT verification per stakeholder role
// =============================================

import { type Request, type Response, type NextFunction, type RequestHandler } from 'express';
import cookieParser from 'cookie-parser';

import { AUTH_COOKIE, HTTP_STATUS, STAKEHOLDER, type IJWTPayload, type StakeholderType } from '@sakalsense/core';

import { verifyJWT } from '../services';
import { validateSession, updateSessionActivity } from '../services/session.service';

// Cookie parser middleware (use once in app)
export const parseCookies: RequestHandler = cookieParser();

// Generic auth middleware factory - verifies JWT and session for given role
const createAuthMiddleware = (role: StakeholderType): RequestHandler => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const token = req.cookies?.[AUTH_COOKIE[role]];

        if (!token) {
            res.status(HTTP_STATUS.UNAUTHORIZED).json({ success: false, error: 'Authentication required' });
            return;
        }

        const payload = verifyJWT(token);
        if (!payload || payload.role !== role) {
            res.status(HTTP_STATUS.UNAUTHORIZED).json({ success: false, error: 'Invalid token' });
            return;
        }

        // Validate session in Redis
        const isValid = await validateSession(payload.sessionId, payload.userId, role);
        if (!isValid) {
            res.status(HTTP_STATUS.UNAUTHORIZED).json({ success: false, error: 'Session expired' });
            return;
        }

        // Refresh TTL and update lastActiveAt for active sessions
        await updateSessionActivity(payload.sessionId, payload.userId, role);

        // Attach payload to request (access via req.body._user or cast to IAuthenticatedRequest)
        (req as Request & { user: IJWTPayload }).user = payload;
        next();
    };
};

// Role-specific auth middlewares
export const authenticateUser: RequestHandler = createAuthMiddleware(STAKEHOLDER.USER);
export const authenticateAdmin: RequestHandler = createAuthMiddleware(STAKEHOLDER.ADMIN);
export const authenticateAdministrator: RequestHandler = createAuthMiddleware(STAKEHOLDER.ADMINISTRATOR);

// Multi-role middleware - accepts any of the specified roles
export const authenticateAny = (...roles: Array<StakeholderType>): RequestHandler => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        // Try each role's cookie
        const roleWithToken = roles.find((role) => req.cookies?.[AUTH_COOKIE[role]]);
        if (!roleWithToken) {
            res.status(HTTP_STATUS.UNAUTHORIZED).json({ success: false, error: 'Authentication required' });
            return;
        }

        const token = req.cookies[AUTH_COOKIE[roleWithToken]];
        const payload = verifyJWT(token);
        if (!payload || !roles.includes(payload.role)) {
            res.status(HTTP_STATUS.UNAUTHORIZED).json({ success: false, error: 'Invalid token' });
            return;
        }

        const isValid = await validateSession(payload.sessionId, payload.userId, payload.role);
        if (!isValid) {
            res.status(HTTP_STATUS.UNAUTHORIZED).json({ success: false, error: 'Session expired' });
            return;
        }

        // Refresh TTL and update lastActiveAt for active sessions
        await updateSessionActivity(payload.sessionId, payload.userId, payload.role);
        (req as Request & { user: IJWTPayload }).user = payload;
        next();
    };
};

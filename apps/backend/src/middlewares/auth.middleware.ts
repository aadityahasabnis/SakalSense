// =============================================
// Auth Middleware - JWT verification per stakeholder role
// =============================================

import { type Request, type Response, type NextFunction, type RequestHandler } from 'express';
import cookieParser from 'cookie-parser';

import { verifyJWT } from '../services/index.js';
import { validateSession, updateSessionActivity } from '../services/session.service.js';
import { HTTP_STATUS } from '@/constants/http.constants.js';
import { type StakeholderType, AUTH_COOKIE, STAKEHOLDER } from '@/constants/auth.constants.js';
import { type IJWTPayload } from '@/lib/interfaces/auth.interfaces.js';

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

        // Fire-and-forget: refresh TTL in background (don't block request)
        updateSessionActivity(payload.sessionId, payload.userId, role);

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

        // Fire-and-forget: refresh TTL in background
        updateSessionActivity(payload.sessionId, payload.userId, payload.role);
        (req as Request & { user: IJWTPayload }).user = payload;
        next();
    };
};

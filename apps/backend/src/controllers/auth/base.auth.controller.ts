// =============================================
// Base Auth Controller Factory
// Creates stakeholder-specific auth controllers with shared logic
// =============================================

import { type Request, type Response } from 'express';
import { type Model, type Document, type Types } from 'mongoose';

import { type IAuthenticatedRequest } from '../../interfaces/index.js';
import { hashPassword, verifyPassword, generateJWT, setAuthCookie, clearAuthCookie } from '../../services/index.js';
import { createSession, getActiveSessions, invalidateSession } from '../../services/session.service.js';
import { generateResetToken, validateResetToken, invalidateResetToken } from '../../services/password-reset.service.js';
import { sendPasswordResetEmail } from '../../services/mail.service.js';
import { type DeviceType, type StakeholderType } from '@/constants/auth.constants.js';
import { type IUpdatePasswordRequest, type IJWTPayload, type ILoginRequest, type IForgotPasswordRequest, type IResetPasswordRequest } from '@/lib/interfaces/auth.interfaces.js';
import { HTTP_STATUS } from '@/constants/http.constants.js';
import { detectDevice, getClientIP } from '@/utils/device.utils.js';
import { getLocationFromIP, resolveClientIP } from '@/utils/geolocation.utils.js';

// Base document interface for all stakeholder models
interface IBaseStakeholderDocument extends Document {
    _id: Types.ObjectId;
    fullName: string;
    email: string;
    password: string;
    avatarLink?: string;
    isActive: boolean;
}

// Config for creating auth controller
interface IAuthControllerConfig<T extends IBaseStakeholderDocument> {
    role: StakeholderType;
    model: Model<T>;
    supportsRegistration?: boolean;
    validateRegistration?: (body: Record<string, unknown>) => { valid: boolean; error?: string };
    createDocument?: (body: Record<string, unknown>, hashedPassword: string) => Promise<T>;
}

// Shared request context extraction
const extractRequestContext = async (req: Request): Promise<{ device: DeviceType; ip: string; location: string | null; userAgent: string }> => {
    const device = detectDevice(req.get('user-agent') ?? '');
    const detectedIP = getClientIP(req);
    const ip = await resolveClientIP(detectedIP);
    const location = await getLocationFromIP(ip);
    const userAgent = req.get('user-agent') ?? '';
    return { device, ip, location, userAgent };
};

// Build JWT payload
const buildJWTPayload = (userId: string, fullName: string, avatarLink: string | null, role: StakeholderType, sessionId: string): IJWTPayload => ({
    userId,
    fullName,
    avatarLink,
    role,
    sessionId,
});

// Build user response object
const buildUserResponse = (userId: string, fullName: string, email: string, avatarLink: string | null): { id: string; fullName: string; email: string; avatarLink: string | null } => ({
    id: userId,
    fullName,
    email,
    avatarLink,
});

// Auth controller return type
export interface IAuthController {
    login: (req: Request, res: Response) => Promise<void>;
    register: ((req: Request, res: Response) => Promise<void>) | undefined;
    logout: (req: Request, res: Response) => Promise<void>;
    getSessions: (req: Request, res: Response) => Promise<void>;
    terminateSession: (req: Request, res: Response) => Promise<void>;
    updatePassword: (req: Request, res: Response) => Promise<void>;
    forgotPassword: (req: Request, res: Response) => Promise<void>;
    resetPassword: (req: Request, res: Response) => Promise<void>;
}

// Factory function to create auth controllers
export const createAuthController = <T extends IBaseStakeholderDocument>(config: IAuthControllerConfig<T>): IAuthController => {
    const { role, model, supportsRegistration = false, validateRegistration, createDocument } = config;

    // Login handler
    const login = async (req: Request, res: Response): Promise<void> => {
        const { email, password } = req.body as ILoginRequest;

        if (!email || !password) {
            res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, error: 'Email and password required' });
            return;
        }

        const entity = await model.findOne({ email: email.toLowerCase(), isActive: true }).select('+password');
        if (!entity || !(await verifyPassword(password, entity.password))) {
            res.status(HTTP_STATUS.UNAUTHORIZED).json({ success: false, error: 'Invalid credentials' });
            return;
        }

        const userId = (entity._id as { toString(): string }).toString();
        const { device, ip, location, userAgent } = await extractRequestContext(req);
        const { session, limitExceeded, activeSessions } = await createSession(userId, role, device, ip, userAgent, location);

        if (limitExceeded) {
            res.status(HTTP_STATUS.CONFLICT).json({
                success: false,
                error: 'Session limit exceeded',
                data: {
                    sessionLimitExceeded: true,
                    activeSessions,
                },
            });
            return;
        }

        const token = generateJWT(buildJWTPayload(userId, entity.fullName, entity.avatarLink ?? null, role, session.sessionId));
        setAuthCookie(res, token, role);

        res.json({
            success: true,
            data: { user: buildUserResponse(userId, entity.fullName, entity.email, entity.avatarLink ?? null) },
        });
    };

    // Register handler (optional)
    const register =
        supportsRegistration && validateRegistration && createDocument
            ? async (req: Request, res: Response): Promise<void> => {
                  const body = req.body as Record<string, unknown>;
                  const validation = validateRegistration(body);

                  if (!validation.valid) {
                      res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, error: validation.error });
                      return;
                  }

                  const email = (body.email as string).toLowerCase();
                  const exists = await model.findOne({ email });
                  if (exists) {
                      res.status(HTTP_STATUS.CONFLICT).json({ success: false, error: 'Email already registered' });
                      return;
                  }

                  const hashedPassword = await hashPassword(body.password as string);
                  const entity = await createDocument(body, hashedPassword);

                  const userId = (entity._id as { toString(): string }).toString();
                  const { device, ip, location, userAgent } = await extractRequestContext(req);
                  const { session } = await createSession(userId, role, device, ip, userAgent, location);

                  const token = generateJWT(buildJWTPayload(userId, entity.fullName, null, role, session.sessionId));
                  setAuthCookie(res, token, role);

                  res.status(HTTP_STATUS.CREATED).json({
                      success: true,
                      data: { user: buildUserResponse(userId, entity.fullName, entity.email, null) },
                  });
              }
            : undefined;

    // Logout handler
    const logout = async (req: Request, res: Response): Promise<void> => {
        const { user } = req as IAuthenticatedRequest;
        await invalidateSession(user.sessionId, user.userId, user.role);
        clearAuthCookie(res, role);
        res.json({ success: true, message: 'Logged out successfully' });
    };

    // Get sessions handler (requires credentials verification)
    const getSessions = async (req: Request, res: Response): Promise<void> => {
        const { email, password } = req.body as ILoginRequest;

        if (!email || !password) {
            res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, error: 'Email and password required' });
            return;
        }

        const entity = await model.findOne({ email: email.toLowerCase(), isActive: true }).select('+password');
        if (!entity || !(await verifyPassword(password, entity.password))) {
            res.status(HTTP_STATUS.UNAUTHORIZED).json({ success: false, error: 'Invalid credentials' });
            return;
        }

        const userId = (entity._id as { toString(): string }).toString();
        const sessions = await getActiveSessions(userId, role);
        res.json({ success: true, data: { sessions } });
    };

    // Terminate session handler (requires credentials verification)
    const terminateSession = async (req: Request, res: Response): Promise<void> => {
        const { email, password } = req.body as ILoginRequest;
        const { sessionId } = req.params;

        if (!email || !password) {
            res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, error: 'Email and password required' });
            return;
        }

        if (!sessionId) {
            res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, error: 'Session ID required' });
            return;
        }

        const entity = await model.findOne({ email: email.toLowerCase(), isActive: true }).select('+password');
        if (!entity || !(await verifyPassword(password, entity.password))) {
            res.status(HTTP_STATUS.UNAUTHORIZED).json({ success: false, error: 'Invalid credentials' });
            return;
        }

        const userId = (entity._id as { toString(): string }).toString();
        await invalidateSession(sessionId, userId, role);
        res.json({ success: true, message: 'Session terminated' });
    };

    // Update password handler (protected - requires authentication)
    const updatePassword = async (req: Request, res: Response): Promise<void> => {
        const { user } = req as IAuthenticatedRequest;
        const { currentPassword, newPassword } = req.body as IUpdatePasswordRequest;

        // Validate required fields
        if (!currentPassword || !newPassword) {
            res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, error: 'Current password and new password are required' });
            return;
        }

        // Validate new password minimum length
        if (newPassword.length < 8) {
            res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, error: 'New password must be at least 8 characters' });
            return;
        }

        // Fetch user with password
        const entity = await model.findById(user.userId).select('+password');
        if (!entity || !entity.isActive) {
            res.status(HTTP_STATUS.NOT_FOUND).json({ success: false, error: 'User not found' });
            return;
        }

        // Verify current password
        const isValid = await verifyPassword(currentPassword, entity.password);
        if (!isValid) {
            res.status(HTTP_STATUS.UNAUTHORIZED).json({ success: false, error: 'Current password is incorrect' });
            return;
        }

        // Prevent password reuse
        const isSamePassword = await verifyPassword(newPassword, entity.password);
        if (isSamePassword) {
            res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, error: 'New password must be different from current password' });
            return;
        }

        // Hash and update password
        const hashedPassword = await hashPassword(newPassword);
        await model.findByIdAndUpdate(user.userId, { password: hashedPassword });

        res.json({ success: true, message: 'Password updated successfully' });
    };

    // Forgot password handler (public - sends reset email)
    const forgotPassword = async (req: Request, res: Response): Promise<void> => {
        const { email } = req.body as IForgotPasswordRequest;

        // Validate email
        if (!email) {
            res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, error: 'Email is required' });
            return;
        }

        // Always respond with success for security (don't reveal if email exists)
        const successResponse = { success: true, message: 'If that email exists, a password reset link has been sent' };

        // Find user by email
        const entity = await model.findOne({ email: email.toLowerCase(), isActive: true });
        if (!entity) {
            res.json(successResponse);
            return;
        }

        const userId = (entity._id as { toString(): string }).toString();

        // Generate reset token
        const token = await generateResetToken(userId, email.toLowerCase(), role);

        // Build reset link using request origin (role is encoded in token prefix)
        const origin = req.get('origin') ?? req.get('referer')?.replace(/\/[^/]*$/, '') ?? 'http://localhost:3000';
        const resetLink = `${origin}/reset-password?token=${token}`;

        // Send password reset email
        await sendPasswordResetEmail(email.toLowerCase(), {
            recipientName: entity.fullName,
            resetLink,
            expiresIn: '1 hour',
        });

        res.json(successResponse);
    };

    // Reset password handler (public - with token from email)
    const resetPassword = async (req: Request, res: Response): Promise<void> => {
        const { token, newPassword } = req.body as IResetPasswordRequest;

        // Validate required fields
        if (!token || !newPassword) {
            res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, error: 'Token and new password are required' });
            return;
        }

        // Validate new password minimum length
        if (newPassword.length < 8) {
            res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, error: 'New password must be at least 8 characters' });
            return;
        }

        // Validate token (now returns { data, role } from prefixed token)
        const tokenResult = await validateResetToken(token);
        if (!tokenResult) {
            res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, error: 'Invalid or expired reset link' });
            return;
        }

        // Verify the token role matches this controller's role
        if (tokenResult.role !== role) {
            res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, error: 'Invalid reset link for this account type' });
            return;
        }

        // Find user
        const entity = await model.findById(tokenResult.data.userId).select('+password');
        if (!entity || !entity.isActive) {
            res.status(HTTP_STATUS.NOT_FOUND).json({ success: false, error: 'User not found' });
            return;
        }

        // Prevent password reuse
        const isSamePassword = await verifyPassword(newPassword, entity.password);
        if (isSamePassword) {
            res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, error: 'New password must be different from current password' });
            return;
        }

        // Hash and update password
        const hashedPassword = await hashPassword(newPassword);
        await model.findByIdAndUpdate(tokenResult.data.userId, { password: hashedPassword });

        // Invalidate used token
        await invalidateResetToken(token);

        res.json({ success: true, message: 'Password has been reset successfully' });
    };

    return { login, register, logout, getSessions, terminateSession, updatePassword, forgotPassword, resetPassword };
};

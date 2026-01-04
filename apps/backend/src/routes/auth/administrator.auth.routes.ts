// =============================================
// Administrator Authentication Routes
// =============================================

import { Router, type Router as IRouter } from 'express';

import { administratorAuthController } from '@/controllers/index.js';
import { asyncHandler, authenticateAdministrator, rateLimitAuth, rateLimitStrict } from '@/middlewares';

const router: IRouter = Router();

// Public routes (rate limited)
router.post('/login', rateLimitAuth, asyncHandler(administratorAuthController.login));
router.post('/sessions', rateLimitStrict, asyncHandler(administratorAuthController.getSessions));
router.post('/sessions/terminate/:sessionId', rateLimitStrict, asyncHandler(administratorAuthController.terminateSession));
router.post('/forgot-password', rateLimitStrict, asyncHandler(administratorAuthController.forgotPassword));
router.post('/reset-password', rateLimitStrict, asyncHandler(administratorAuthController.resetPassword));

// Protected routes
router.post('/logout', authenticateAdministrator, asyncHandler(administratorAuthController.logout));
router.patch('/update-password', authenticateAdministrator, asyncHandler(administratorAuthController.updatePassword));

export { router as administratorAuthRouter };

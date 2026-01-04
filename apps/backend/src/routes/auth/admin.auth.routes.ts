// =============================================
// Admin Authentication Routes
// =============================================

import { Router, type Router as IRouter } from 'express';

import { adminAuthController } from '@/controllers';
import { asyncHandler, authenticateAdmin, rateLimitAuth, rateLimitStrict } from '@/middlewares';

const router: IRouter = Router();

// Public routes (rate limited)
router.post('/login', rateLimitAuth, asyncHandler(adminAuthController.login));
router.post('/register', rateLimitAuth, asyncHandler(adminAuthController.register!));
router.post('/sessions', rateLimitStrict, asyncHandler(adminAuthController.getSessions));
router.post('/sessions/terminate/:sessionId', rateLimitStrict, asyncHandler(adminAuthController.terminateSession));
router.post('/forgot-password', rateLimitStrict, asyncHandler(adminAuthController.forgotPassword));
router.post('/reset-password', rateLimitStrict, asyncHandler(adminAuthController.resetPassword));

// Protected routes
router.post('/logout', authenticateAdmin, asyncHandler(adminAuthController.logout));
router.patch('/update-password', authenticateAdmin, asyncHandler(adminAuthController.updatePassword));

export { router as adminAuthRouter };

// =============================================
// User Authentication Routes
// =============================================

import { Router, type Router as IRouter } from 'express';

import { userAuthController } from '@/controllers';
import { asyncHandler, authenticateUser, rateLimitAuth, rateLimitStrict } from '@/middlewares';

const router: IRouter = Router();

// Public routes (rate limited)
router.post('/login', rateLimitAuth, asyncHandler(userAuthController.login));
router.post('/register', rateLimitAuth, asyncHandler(userAuthController.register!));
router.post('/sessions', rateLimitStrict, asyncHandler(userAuthController.getSessions));
router.post('/sessions/terminate/:sessionId', rateLimitStrict, asyncHandler(userAuthController.terminateSession));
router.post('/forgot-password', rateLimitStrict, asyncHandler(userAuthController.forgotPassword));
router.post('/reset-password', rateLimitStrict, asyncHandler(userAuthController.resetPassword));

// Protected routes
router.post('/logout', authenticateUser, asyncHandler(userAuthController.logout));
router.patch('/update-password', authenticateUser, asyncHandler(userAuthController.updatePassword));

export { router as userAuthRouter };

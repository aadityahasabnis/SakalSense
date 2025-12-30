// =============================================
// User Authentication Routes
// =============================================

import { userAuthController } from '@/controllers';
import { asyncHandler, authenticateUser } from '@/middlewares';
import { Router, type Router as IRouter } from 'express';

const router: IRouter = Router();

// Public routes
router.post('/login', asyncHandler(userAuthController.login));
router.post('/register', asyncHandler(userAuthController.register!));
router.post('/sessions', asyncHandler(userAuthController.getSessions));
router.post('/sessions/terminate/:sessionId', asyncHandler(userAuthController.terminateSession));

// Protected routes
router.post('/logout', authenticateUser, asyncHandler(userAuthController.logout));
router.patch('/update-password', authenticateUser, asyncHandler(userAuthController.updatePassword));

export { router as userAuthRouter };

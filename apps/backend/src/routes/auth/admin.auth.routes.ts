// =============================================
// Admin Authentication Routes
// =============================================

import { adminAuthController } from '@/controllers';
import { asyncHandler, authenticateAdmin } from '@/middlewares';
import { Router, type Router as IRouter } from 'express';

const router: IRouter = Router();

// Public routes
router.post('/login', asyncHandler(adminAuthController.login));
router.post('/register', asyncHandler(adminAuthController.register!));
router.post('/sessions', asyncHandler(adminAuthController.getSessions));
router.post('/sessions/terminate/:sessionId', asyncHandler(adminAuthController.terminateSession));

// Protected routes
router.post('/logout', authenticateAdmin, asyncHandler(adminAuthController.logout));
router.patch('/update-password', authenticateAdmin, asyncHandler(adminAuthController.updatePassword));

export { router as adminAuthRouter };

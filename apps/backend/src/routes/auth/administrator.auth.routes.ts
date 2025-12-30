// =============================================
// Administrator Authentication Routes
// =============================================

import { Router, type Router as IRouter } from 'express';

import { administratorAuthController } from '@/controllers/index.js';
import { asyncHandler, authenticateAdministrator } from '@/middlewares';

const router: IRouter = Router();

// Public routes
router.post('/login', asyncHandler(administratorAuthController.login));
router.post('/sessions', asyncHandler(administratorAuthController.getSessions));
router.post('/sessions/terminate/:sessionId', asyncHandler(administratorAuthController.terminateSession));

// Protected routes
router.post('/logout', authenticateAdministrator, asyncHandler(administratorAuthController.logout));
router.patch('/update-password', authenticateAdministrator, asyncHandler(administratorAuthController.updatePassword));

export { router as administratorAuthRouter };

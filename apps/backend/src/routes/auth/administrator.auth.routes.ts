// =============================================
// Administrator Authentication Routes
// =============================================

import { Router, type Router as IRouter } from 'express';

import { ROUTE } from 'sakalsense-core';

import { asyncHandler } from '../../middlewares/index.js';
import { authenticateAdministrator } from '../../middlewares/auth.middleware.js';
import { administratorAuthController } from '../../controllers/index.js';

const router: IRouter = Router();

// Public routes
router.post(ROUTE.LOGIN, asyncHandler(administratorAuthController.login));
router.post(ROUTE.SESSIONS, asyncHandler(administratorAuthController.getSessions));
router.post(`${ROUTE.SESSIONS}/:sessionId${ROUTE.TERMINATE}`, asyncHandler(administratorAuthController.terminateSession));

// Protected routes
router.post(ROUTE.LOGOUT, authenticateAdministrator, asyncHandler(administratorAuthController.logout));
router.patch(ROUTE.UPDATE_PASSWORD, authenticateAdministrator, asyncHandler(administratorAuthController.updatePassword));

export { router as administratorAuthRouter };

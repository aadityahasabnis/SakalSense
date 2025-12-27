// =============================================
// Admin Authentication Routes
// =============================================

import { Router, type Router as IRouter } from 'express';

import { ROUTE } from 'sakalsense-core';

import { asyncHandler } from '../../middlewares';
import { authenticateAdmin } from '../../middlewares/auth.middleware';
import { adminAuthController } from '../../controllers';

const router: IRouter = Router();

// Public routes
router.post(ROUTE.LOGIN, asyncHandler(adminAuthController.login));
router.post(ROUTE.REGISTER, asyncHandler(adminAuthController.register!));
router.post(ROUTE.SESSIONS, asyncHandler(adminAuthController.getSessions));
router.post(`${ROUTE.SESSIONS}/:sessionId${ROUTE.TERMINATE}`, asyncHandler(adminAuthController.terminateSession));

// Protected routes
router.post(ROUTE.LOGOUT, authenticateAdmin, asyncHandler(adminAuthController.logout));
router.patch(ROUTE.UPDATE_PASSWORD, authenticateAdmin, asyncHandler(adminAuthController.updatePassword));

export { router as adminAuthRouter };

// =============================================
// User Authentication Routes
// =============================================

import { Router, type Router as IRouter } from 'express';

import { ROUTE } from '@sakalsense/core';

import { asyncHandler } from '../../middlewares';
import { authenticateUser } from '../../middlewares/auth.middleware';
import { userAuthController } from '../../controllers';

const router: IRouter = Router();

// Public routes
router.post(ROUTE.LOGIN, asyncHandler(userAuthController.login));
router.post(ROUTE.REGISTER, asyncHandler(userAuthController.register!));
router.post(ROUTE.SESSIONS, asyncHandler(userAuthController.getSessions));
router.post(`${ROUTE.SESSIONS}/:sessionId${ROUTE.TERMINATE}`, asyncHandler(userAuthController.terminateSession));

// Protected routes
router.post(ROUTE.LOGOUT, authenticateUser, asyncHandler(userAuthController.logout));
router.patch(ROUTE.UPDATE_PASSWORD, authenticateUser, asyncHandler(userAuthController.updatePassword));

export { router as userAuthRouter };

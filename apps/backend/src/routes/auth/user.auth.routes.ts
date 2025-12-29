// =============================================
// User Authentication Routes
// =============================================

import { Router, type Router as IRouter } from 'express';


import { asyncHandler } from '../../middlewares/index.js';
import { authenticateUser } from '../../middlewares/auth.middleware.js';
import { userAuthController } from '../../controllers/index.js';
import { ROUTE } from '@/constants/routes/routes.constants.js';

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

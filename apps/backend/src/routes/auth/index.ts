// =============================================
// Auth Routes - Combines all stakeholder auth routers
// =============================================

import { Router, type Router as IRouter } from 'express';

import { ROUTE } from 'sakalsense-core';

import { userAuthRouter } from './user.auth.routes';
import { adminAuthRouter } from './admin.auth.routes';
import { administratorAuthRouter } from './administrator.auth.routes';

export const authRouter: IRouter = Router();

authRouter.use(ROUTE.USER, userAuthRouter);
authRouter.use(ROUTE.ADMIN, adminAuthRouter);
authRouter.use(ROUTE.ADMINISTRATOR, administratorAuthRouter);

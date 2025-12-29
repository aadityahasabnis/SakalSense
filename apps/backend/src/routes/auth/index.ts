// =============================================
// Auth Routes - Combines all stakeholder auth routers
// =============================================

import { Router, type Router as IRouter } from 'express';

import { userAuthRouter } from './user.auth.routes.js';
import { adminAuthRouter } from './admin.auth.routes.js';
import { administratorAuthRouter } from './administrator.auth.routes.js';
import { ROUTE } from '@/constants/routes/routes.constants.js';

export const authRouter: IRouter = Router();

authRouter.use(ROUTE.USER, userAuthRouter);
authRouter.use(ROUTE.ADMIN, adminAuthRouter);
authRouter.use(ROUTE.ADMINISTRATOR, administratorAuthRouter);

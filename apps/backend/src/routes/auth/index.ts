// =============================================
// Auth Routes - Combines all stakeholder auth routers
// =============================================

import { Router, type Router as IRouter } from 'express';

import { userAuthRouter } from './user.auth.routes.js';
import { adminAuthRouter } from './admin.auth.routes.js';
import { administratorAuthRouter } from './administrator.auth.routes.js';

export const authRouter: IRouter = Router();

authRouter.use('/user', userAuthRouter);
authRouter.use('/admin', adminAuthRouter);
authRouter.use('/administrator', administratorAuthRouter);

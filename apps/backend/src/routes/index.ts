// =============================================
// Main API Router - Combines all feature routers
// =============================================

import { Router, type Router as IRouter } from 'express';

import { ROUTE } from 'sakalsense-core';

import { healthRouter } from './health';
import { authRouter } from './auth';

export const apiRouter: IRouter = Router();

apiRouter.use(ROUTE.HEALTH, healthRouter);
apiRouter.use(ROUTE.AUTH, authRouter);

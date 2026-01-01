// =============================================
// Main API Router - Combines all feature routers
// =============================================

import { Router, type Router as IRouter } from 'express';

import { authRouter } from './auth/index.js';
import { healthRouter } from './health/health.route.js';
import { mailRouter } from './mail/index.js';

export const apiRouter: IRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/mail', mailRouter);
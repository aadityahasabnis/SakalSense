// Main API router - combines all feature routers into single router instance
// Each feature mounted at its own base path for clean URL structure

import { Router, type Router as IRouter } from 'express';

import { healthRouter } from './health';

// apiRouter: Root router that aggregates all feature-specific routers
// Explicit type annotation prevents inferred type portability issues with express-serve-static-core
// Mounted at /api in main app, so routes become /api/health, /api/user, etc.
export const apiRouter: IRouter = Router();

// Health routes - /api/health
apiRouter.use('/health', healthRouter);

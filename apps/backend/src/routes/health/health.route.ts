// Health check routes - defines endpoints for system health monitoring
// Used by load balancers, Kubernetes probes, and monitoring systems

import { Router, type Router as IRouter } from 'express';

import { getHealth } from './health.controller';

// healthRouter: Express Router instance for health-related endpoints
// Explicit type annotation prevents inferred type portability issues with express-serve-static-core
export const healthRouter: IRouter = Router();

// GET /api/health - Returns overall system health status
healthRouter.get('/', getHealth);

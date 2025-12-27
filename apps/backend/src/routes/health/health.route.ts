// =============================================
// Health Routes - System health monitoring
// =============================================

import { Router, type Router as IRouter } from 'express';

import { getHealth } from './health.controller.js';

export const healthRouter: IRouter = Router();

healthRouter.get('/', getHealth);

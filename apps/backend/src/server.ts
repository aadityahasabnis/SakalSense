// =============================================
// Vercel Serverless Entry Point
// =============================================

import type { IncomingMessage, ServerResponse } from 'http';
import express, { type Express } from 'express';
import helmet from 'helmet';
import compression from 'compression';

import { ROUTE } from '@sakalsense/core';

import { validateEnv, IS_PRODUCTION, IS_DEVELOPMENT } from './config';
import { connectMongoDB, connectRedis } from './db';
import { apiRouter } from './routes';
import { errorHandler, requestLogger, corsMiddleware, parseCookies, debugLoggerMiddleware } from './middlewares';

// Database connection promise (connect once, reuse across invocations)
let dbConnected = false;

const connectDatabases = async (): Promise<void> => {
    if (dbConnected) return;
    await Promise.all([connectMongoDB(), connectRedis()]);
    dbConnected = true;
};

// Create Express app
const createExpressApp = (): Express => {
    validateEnv();

    const app = express();
    app.disable('x-powered-by');

    app.use(helmet({ contentSecurityPolicy: IS_PRODUCTION, crossOriginEmbedderPolicy: IS_PRODUCTION }));
    app.use(corsMiddleware);
    app.use(compression());
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    app.use(parseCookies);
    app.use(debugLoggerMiddleware);

    if (IS_DEVELOPMENT) {
        app.use(requestLogger);
    }

    app.use(ROUTE.API, apiRouter);
    app.use(errorHandler);

    return app;
};

const app = createExpressApp();

// Vercel serverless handler
export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
    await connectDatabases();
    app(req as never, res as never);
}

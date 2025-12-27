// =============================================
// Vercel Serverless Entry Point (Clean Version)
// =============================================

import express, { type Express } from 'express';
import { createRequire } from 'module';
import compression from 'compression';

const require = createRequire(import.meta.url);
const helmet = require('helmet');

import { ROUTE } from 'sakalsense-core';
import { validateEnv, IS_PRODUCTION, IS_DEVELOPMENT } from './config';
import { connectMongoDB, connectRedis } from './db';
import { apiRouter } from './routes';
import { errorHandler, requestLogger, corsMiddleware, parseCookies, debugLoggerMiddleware } from './middlewares';

let dbConnected = false;

const connectDatabases = async (): Promise<void> => {
    if (dbConnected) return;
    await Promise.all([connectMongoDB(), connectRedis()]);
    dbConnected = true;
};

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

    app.use(async (_req, _res, next) => {
        await connectDatabases();
        next();
    });

    app.use(ROUTE.API, apiRouter);
    app.use(errorHandler);

    return app;
};

const app = createExpressApp();

// Lazy-load database connections on first request
app.use(async (_req, _res, next) => {
    await connectDatabases();
    next();
});

// Vercel serverless - export app directly
export default app;

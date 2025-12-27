// =============================================
// Vercel Serverless Entry Point
// =============================================

import express, { type Express } from 'express';
import { createRequire } from 'module';
import compression from 'compression';

const require = createRequire(import.meta.url);
const helmet = require('helmet');

import { ROUTE } from 'sakalsense-core';
import { validateEnv, IS_PRODUCTION, IS_DEVELOPMENT } from './config';
import { apiRouter } from './routes';
import { errorHandler, requestLogger, corsMiddleware, parseCookies, debugLoggerMiddleware } from './middlewares';

const createExpressApp = (): Express => {
    validateEnv();

    const app = express();
    app.disable('x-powered-by');

    // Security & CORS
    app.use(helmet({ contentSecurityPolicy: IS_PRODUCTION, crossOriginEmbedderPolicy: IS_PRODUCTION }));
    app.use(corsMiddleware);
    app.use(compression());

    // Parsing
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    app.use(parseCookies);

    // Logging (development only)
    if (IS_DEVELOPMENT) {
        app.use(requestLogger);
    }

    // Debug logger (production only)
    if (IS_PRODUCTION) {
        app.use(debugLoggerMiddleware);
    }

    // Routes
    app.use(ROUTE.API, apiRouter);
    app.use(errorHandler);

    return app;
};

const app = createExpressApp();

// Vercel serverless - export app directly
export default app;

// =============================================
// SakalSense Backend - Express Application
// =============================================
// Exports the Express app for use by both:
// - Local server (src/index.ts)
// - Vercel serverless (api/index.ts)
// =============================================

import express, { type Express } from 'express';
import { createRequire } from 'module';
import compression from 'compression';

const require = createRequire(import.meta.url);
const helmet = require('helmet');

import { validateEnv, IS_PRODUCTION, IS_DEVELOPMENT } from './config/index.js';
import { apiRouter } from './routes/index.js';
import { errorHandler, requestLogger, corsMiddleware, parseCookies, debugLoggerMiddleware } from './middlewares/index.js';
import { ROUTE } from './constants/routes/routes.constants.js';

// =============================================
// Express Application Factory
// =============================================

export const createExpressApp = (): Express => {
    validateEnv();

    const app = express();

    // Disable Express signature for security
    app.disable('x-powered-by');

    // =============================================
    // Security Middleware
    // =============================================
    app.use(
        helmet({
            contentSecurityPolicy: IS_PRODUCTION,
            crossOriginEmbedderPolicy: IS_PRODUCTION,
        }),
    );
    app.use(corsMiddleware);

    // =============================================
    // Performance Middleware
    // =============================================
    app.use(compression());

    // =============================================
    // Body Parsing Middleware
    // =============================================
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    app.use(parseCookies);

    // =============================================
    // Debug Logging Middleware (Redis)
    // =============================================
    app.use(debugLoggerMiddleware);

    // =============================================
    // Logging Middleware
    // =============================================
    if (IS_DEVELOPMENT) {
        app.use(requestLogger);
    }

    // =============================================
    // API Routes
    // =============================================
    app.use(ROUTE.API, apiRouter);

    // =============================================
    // Error Handling (Must be last)
    // =============================================
    app.use(errorHandler);

    return app;
};

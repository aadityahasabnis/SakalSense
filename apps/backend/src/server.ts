// =============================================
// Vercel Serverless Entry Point
// =============================================

import express, { type Express } from 'express';
import compression from 'compression';
import serverless from 'serverless-http';

import { ROUTE } from 'sakalsense-core';
import { validateEnv, IS_DEVELOPMENT } from './config/index.js';
import { connectMongoDB, connectRedis } from './db/index.js';
import { apiRouter } from './routes/index.js';
import { errorHandler, requestLogger, corsMiddleware, parseCookies } from './middlewares/index.js';

let dbConnected = false;

const connectDatabases = async (): Promise<void> => {
    if (dbConnected) return;
    try {
        await Promise.all([connectMongoDB(), connectRedis()]);
        dbConnected = true;
        console.log('✅ Databases connected');
    } catch (error) {
        console.error('❌ Database connection failed:', error);
        throw error; // Let error handler catch this
    }
};

const createExpressApp = (): Express => {
    validateEnv();

    const app = express();
    app.disable('x-powered-by');

    // CORS & Compression
    app.use(corsMiddleware);
    app.use(compression());

    // Parsing
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    app.use(parseCookies);

    // Logging
    if (IS_DEVELOPMENT) {
        app.use(requestLogger);
    }

    // Debug Logger temporarily disabled for debugging timeout
    // if (IS_PRODUCTION) {
    //     app.use(debugLoggerMiddleware);
    // }

    // Database connection middleware - lazy connect on first request
    app.use(async (_req, res, next) => {
        try {
            await connectDatabases();
            next();
        } catch {
            res.status(503).json({
                error: 'Service Unavailable',
                message: 'Database connection failed',
            });
        }
    });

    // Routes
    app.use(ROUTE.API, apiRouter);
    app.use(errorHandler);

    return app;
};

const app = createExpressApp();

// Vercel serverless handler
export default serverless(app);

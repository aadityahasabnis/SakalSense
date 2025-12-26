// =============================================
// Express Application Entry Point
// =============================================

import express from 'express';
import helmet from 'helmet';
import compression from 'compression';

import { ROUTE } from '@sakalsense/core';

import { PORT, NODE_ENV, validateEnv } from './config';
import { connectMongoDB, connectRedis } from './db';
import { apiRouter } from './routes';
import { errorHandler, requestLogger, corsMiddleware, parseCookies } from './middlewares';

const bootstrap = async (): Promise<void> => {
    validateEnv();

    const app = express();

    // Security
    app.use(helmet());
    app.use(corsMiddleware);

    // Performance
    app.use(compression());

    // Body parsers + Cookies
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(parseCookies);

    // Logging
    app.use(requestLogger);

    app.use(ROUTE.API, apiRouter);

    // Error handler (must be last)
    app.use(errorHandler);

    // Database connections
    await connectMongoDB();
    await connectRedis();

    app.listen(PORT, () => console.log(`[Server] Running on http://localhost:${PORT} (${NODE_ENV})`));
};

bootstrap().catch(console.error);

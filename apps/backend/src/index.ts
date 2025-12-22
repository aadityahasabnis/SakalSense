// Express application entry point
// Env vars loaded via CLI: tsx watch --env-file=.env.local

import express from 'express';
import helmet from 'helmet';
import compression from 'compression';

import { PORT, NODE_ENV, validateEnv } from './config';
import { connectMongoDB, connectRedis } from './db';
import { apiRouter } from './routes';
import { errorHandler, requestLogger, corsMiddleware } from './middlewares';

// bootstrap: Async function for server initialization
const bootstrap = async (): Promise<void> => {
    validateEnv();

    const app = express();

    // Security
    app.use(helmet());
    app.use(corsMiddleware);

    // Performance
    app.use(compression());

    // Body parsers
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Logging
    app.use(requestLogger);

    // Routes
    app.use('/api', apiRouter);

    // Error handler (must be last)
    app.use(errorHandler);

    // Database connections
    await connectMongoDB();
    await connectRedis();

    // Start server
    app.listen(PORT, () => console.log(`[Server] Running on http://localhost:${PORT} (${NODE_ENV})`));
};

bootstrap().catch(console.error);

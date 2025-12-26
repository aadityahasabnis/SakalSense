// =============================================
// Express Application - Vercel Serverless Compatible
// =============================================

import express from 'express';
import helmet from 'helmet';
import compression from 'compression';

import { ROUTE } from '@sakalsense/core';

import { validateEnv } from './config';
import { connectMongoDB, connectRedis } from './db';
import { apiRouter } from './routes';
import { errorHandler, requestLogger, corsMiddleware, parseCookies } from './middlewares';

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

// Database connections (lazy init for serverless)
let dbConnected = false;
const initDB = async (): Promise<void> => {
    if (!dbConnected) {
        await connectMongoDB();
        await connectRedis();
        dbConnected = true;
    }
};

// Vercel serverless handler
export default async (req: express.Request, res: express.Response): Promise<void> => {
    await initDB();
    app(req, res);
};

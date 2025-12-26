// =============================================
// SakalSense Backend - Express Application
// =============================================
// Express server with support for:
// - Local development
// - Vercel serverless deployment
// - Database connection pooling
// - Graceful shutdown handling
// =============================================

import express, { type Express } from 'express';
import helmet from 'helmet';
import compression from 'compression';

import { ROUTE } from '@sakalsense/core';

import { PORT, NODE_ENV, validateEnv, IS_PRODUCTION, IS_DEVELOPMENT } from './config';
import { connectMongoDB, connectRedis, disconnectMongoDB, disconnectRedis } from './db';
import { apiRouter } from './routes';
import { errorHandler, requestLogger, corsMiddleware, parseCookies } from './middlewares';
import { type Server } from 'node:http';

const SERVER_NAME = 'SakalSense API';
const SHUTDOWN_TIMEOUT = 5000; // 5 seconds

let dbInitialized = false;
let isShuttingDown = false;
let httpServer: Server | null = null;

const initializeDatabases = async (): Promise<void> => {
    if (dbInitialized) {
        console.log('[Database] Using existing connections');
        return;
    }

    try {
        console.log('[Database] Initializing connections...');
        await Promise.all([connectMongoDB(), connectRedis()]);
        dbInitialized = true;
        console.log('[Database] All connections established');
    } catch (error) {
        console.error('[Database] Connection failed:', error);
        throw error;
    }
};

// =============================================
// Express Application Factory
// =============================================

const createExpressApp = (): Express => {
    validateEnv();

    const app = express();

    // Disable Express signature for security
    app.disable('x-powered-by');

    // Security Middleware
    app.use(helmet({ contentSecurityPolicy: IS_PRODUCTION, crossOriginEmbedderPolicy: IS_PRODUCTION }));
    app.use(corsMiddleware);

    // Performance Middleware
    app.use(compression());

    // Body Parsing Middleware
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    app.use(parseCookies);

    // Logging Middleware
    if (IS_DEVELOPMENT) app.use(requestLogger);

    // =============================================
    app.use(ROUTE.API, apiRouter);
    // =============================================

    // Error Handling
    app.use(errorHandler);

    return app;
};

const app = createExpressApp();

// =============================================
// Graceful Shutdown Handler
// =============================================
const gracefulShutdown = async (signal: string): Promise<void> => {
    if (isShuttingDown) {
        console.log(`[${signal}] Shutdown already in progress...`);
        return;
    }

    isShuttingDown = true;
    console.log(`\n[${signal}] Received. Starting graceful shutdown...`);

    const shutdownTimer = setTimeout(() => {
        console.error('[Shutdown] Forced shutdown due to timeout');
        process.exit(1);
    }, SHUTDOWN_TIMEOUT);

    try {
        // Stop accepting new connections
        if (httpServer) {
            console.log('[Shutdown] Stopping HTTP server...');
            await new Promise<void>((resolve, reject) => {
                httpServer!.close((err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            console.log('[Shutdown] HTTP server stopped');
        }

        // Close database connections
        console.log('[Shutdown] Closing database connections...');
        await Promise.allSettled([disconnectMongoDB(), disconnectRedis()]);

        console.log('[Shutdown] Database connections closed');
        clearTimeout(shutdownTimer);
        console.log('[Shutdown] Graceful shutdown completed');
        process.exit(0);
    } catch (error) {
        console.error('[Shutdown] Error during shutdown:', error);
        clearTimeout(shutdownTimer);
        process.exit(1);
    }
};

// =============================================
// Local Development Server
// =============================================

const startLocalServer = async (): Promise<void> => {
    try {
        console.log(`\n🚀 Starting ${SERVER_NAME}...`);
        console.log(`📦 Environment: ${NODE_ENV}`);

        // Initialize database connections
        await initializeDatabases();

        // Start HTTP server
        httpServer = app.listen(PORT, () => {
            console.log(`\n✅ ${SERVER_NAME} is running`);
            console.log(`🌐 Local: http://localhost:${PORT}`);
        });

        // Handle server errors
        httpServer.on('error', (error: NodeJS.ErrnoException) => {
            if (error.code === 'EADDRINUSE') {
                console.error(`❌ Port ${PORT} is already in use`);
            } else {
                console.error('❌ Server error:', error);
            }
            process.exit(1);
        });

        // Register shutdown handlers
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
        process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // For tsx watch
        process.on('uncaughtException', (error) => {
            console.error('[Fatal] Uncaught Exception:', error);
            gracefulShutdown('UNCAUGHT_EXCEPTION');
        });
        process.on('unhandledRejection', (reason, promise) => {
            console.error('[Fatal] Unhandled Rejection at:', promise, 'reason:', reason);
            gracefulShutdown('UNHANDLED_REJECTION');
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

// =============================================
// Serverless Handler (Production)
// =============================================
app.use(async (_req, res, next) => {
    if (IS_PRODUCTION) {
        try {
            await initializeDatabases();
        } catch (error) {
            console.error('[Serverless] Database initialization failed:', error);
            return res.status(503).json({
                success: false,
                message: 'Service temporarily unavailable',
            });
        }
    }
    next();
});

export default app;

// =============================================
// Application Entry Point
// =============================================

// Run server only in local development
if (IS_DEVELOPMENT) {
    startLocalServer().catch((error) => {
        console.error('❌ Server startup failed:', error);
        process.exit(1);
    });
}

// =============================================
// Vercel Serverless Function Handler
// =============================================
// This file is the entry point for Vercel serverless deployment
// It exports the Express app as the default handler
// =============================================

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createExpressApp } from '../src/app.js';
import { connectMongoDB, connectRedis } from '../src/db/index.js';

// =============================================
// Database Connection Management
// =============================================
// Vercel keeps the function container warm, so we can reuse connections
let isInitialized = false;
let initializationPromise: Promise<void> | null = null;

const initializeConnections = async (): Promise<void> => {
    if (isInitialized) {
        return;
    }

    // Prevent multiple simultaneous initializations
    if (initializationPromise) {
        return initializationPromise;
    }

    initializationPromise = (async () => {
        try {
            console.log('[Vercel] Initializing database connections...');
            await Promise.all([connectMongoDB(), connectRedis()]);
            isInitialized = true;
            console.log('[Vercel] Database connections established');
        } catch (error) {
            console.error('[Vercel] Failed to initialize connections:', error);
            initializationPromise = null; // Allow retry on next request
            throw error;
        }
    })();

    return initializationPromise;
};

// =============================================
// Express App Creation
// =============================================
// Create app once and reuse across invocations
const app = createExpressApp();

// =============================================
// Vercel Serverless Handler
// =============================================
// This is called on every request
const handler = async (req: VercelRequest, res: VercelResponse): Promise<void> => {
    try {
        // Initialize connections on first request (or after failure)
        await initializeConnections();
        
        // Handle the request with Express
        app(req, res);
    } catch (error) {
        console.error('[Vercel] Handler error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Service initialization failed'
        });
    }
};

// Export for Vercel
export default handler;

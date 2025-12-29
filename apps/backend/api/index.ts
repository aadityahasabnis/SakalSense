// =============================================
// Vercel Serverless Function Handler
// =============================================
// This file is the entry point for Vercel serverless deployment
// It exports the Express app as the default handler
// =============================================

import type { Request, Response } from 'express';
import { createExpressApp } from '../src/app.js';
import { connectMongoDB, connectRedis } from '../src/db/index.js';

// Initialize database connections once (Vercel caches these across invocations)
let initialized = false;

const initializeConnections = async (): Promise<void> => {
    if (!initialized) {
        await Promise.all([connectMongoDB(), connectRedis()]);
        initialized = true;
    }
};

// Create the Express app
const app = createExpressApp();

// Export the handler for Vercel
export default async function handler(req: Request, res: Response): Promise<void> {
    await initializeConnections();
    app(req, res);
}

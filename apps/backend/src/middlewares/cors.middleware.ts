// =============================================
// CORS Middleware - Cross-origin resource sharing config
// =============================================

import cors from 'cors';

import { CORS_ORIGINS } from '../config';

// corsMiddleware: Pre-configured CORS middleware instance
// origin: Function checks if request origin is in allowed list
// credentials: true allows cookies/auth headers in cross-origin requests
export const corsMiddleware = cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);
        // Check if origin is in the allowed list
        if (CORS_ORIGINS.includes(origin)) return callback(null, true);
        // Reject other origins
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
});

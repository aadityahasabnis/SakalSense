// =============================================
// Environment Variables - Type-safe centralized configuration
// =============================================

import { type NodeEnvType } from './types/common.types';

// Node environment
export const NODE_ENV: NodeEnvType = (process.env.NODE_ENV as NodeEnvType) ?? 'development';
export const IS_PRODUCTION = NODE_ENV === 'production';
export const IS_DEVELOPMENT = NODE_ENV === 'development';

// API URL (NEXT_PUBLIC_ for client-side access)
export const API_URL = process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/api` : 'http://localhost:8000/api';

// Database (PostgreSQL via Prisma Accelerate)
export const DATABASE_URL = process.env.DATABASE_URL ?? '';
export const DIRECT_URL = process.env.DIRECT_URL ?? '';

// Redis Cloud
export const REDIS_HOST = process.env.REDIS_HOST ?? 'localhost';
export const REDIS_PORT = Number(process.env.REDIS_PORT) || 6379;
export const REDIS_USERNAME = process.env.REDIS_USERNAME ?? 'default';
export const REDIS_PASSWORD = process.env.REDIS_PASSWORD ?? '';

// JWT/Auth
export const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-in-production';
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '7d';

// Gmail SMTP
export const GMAIL_ACCOUNT = process.env.GMAIL_ACCOUNT ?? '';
export const GMAIL_PASSWORD = process.env.GMAIL_PASSWORD ?? '';

// Public keys (NEXT_PUBLIC_ for client-side)
export const GOOGLE_ANALYTICS_ID = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID ?? '';
export const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN ?? '';

// validateEnv: Fails fast on missing required variables in production
export const validateEnv = (): void => {
    if (IS_PRODUCTION) {
        const required = ['DATABASE_URL', 'JWT_SECRET', 'REDIS_HOST', 'REDIS_PASSWORD', 'GMAIL_ACCOUNT', 'GMAIL_PASSWORD'];
        const missing = required.filter((key) => !process.env[key]);
        if (missing.length > 0) throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
};

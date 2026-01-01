// =============================================
// Environment Variables - Type-safe configuration
// =============================================

import { type NodeEnvType } from '@/lib/interfaces/common.types';

export const NODE_ENV: NodeEnvType = (process.env.NODE_ENV as NodeEnvType) ?? 'development';
export const IS_PRODUCTION: boolean = NODE_ENV === 'production';
export const IS_DEVELOPMENT: boolean = NODE_ENV === 'development';

export const PORT: number = Number(process.env.PORT) || 8000;

export const DATABASE_URL: string = process.env.DATABASE_URL ?? '';

export const REDIS_HOST: string = process.env.REDIS_HOST ?? 'localhost';
export const REDIS_PORT: number = Number(process.env.REDIS_PORT) || 6379;
export const REDIS_USERNAME: string = process.env.REDIS_USERNAME ?? 'default';
export const REDIS_PASSWORD: string | undefined = process.env.REDIS_PASSWORD;

export const JWT_SECRET: string = process.env.JWT_SECRET ?? '';
export const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN ?? '7d';

export const GMAIL_ACCOUNT: string = process.env.GMAIL_ACCOUNT ?? '';
export const GMAIL_PASSWORD: string = process.env.GMAIL_PASSWORD ?? '';

export const CORS_ORIGINS: Array<string> = (process.env.CORS_ORIGINS ?? 'http://localhost:3000').split(',').map((origin) => origin.trim());

// Validation - fails fast on missing required variables
export const validateEnv = (): void => {
    const required = ['DATABASE_URL', 'JWT_SECRET'];
    const missing = required.filter((key) => !process.env[key]);
    if (missing.length > 0) throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
};

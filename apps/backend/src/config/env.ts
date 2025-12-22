// Environment variable exports - Type-safe configuration from .env.local
// Direct constant exports (cleanest pattern) - works because dotenv loads before this module

import { type NodeEnv } from '@sakalsense/core';

// Server
export const NODE_ENV: NodeEnv = (process.env.NODE_ENV as NodeEnv) ?? 'development';
export const PORT: number = Number(process.env.PORT) || 8000;

// Database
export const DATABASE_URL: string = process.env.DATABASE_URL ?? '';

// Redis
export const REDIS_HOST: string = process.env.REDIS_HOST ?? 'localhost';
export const REDIS_PORT: number = Number(process.env.REDIS_PORT) || 6379;
export const REDIS_USERNAME: string = process.env.REDIS_USERNAME ?? 'default';
export const REDIS_PASSWORD: string | undefined = process.env.REDIS_PASSWORD;

// JWT
export const JWT_SECRET: string = process.env.JWT_SECRET ?? '';
export const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN ?? '7d';

// CORS - Comma-separated list of allowed origins (supports multiple: mobile, web, etc.)
// Example: CORS_ORIGINS=http://localhost:3000,http://localhost:3001,https://myapp.com
export const CORS_ORIGINS: Array<string> = (process.env.CORS_ORIGINS ?? 'http://localhost:3000').split(',').map((origin) => origin.trim());

// Validation - fails fast on missing required variables
export const validateEnv = (): void => {
    const required = ['DATABASE_URL', 'JWT_SECRET'];
    const missing = required.filter((key) => !process.env[key]);
    if (missing.length > 0) throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
};

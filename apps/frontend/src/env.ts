// =============================================
// Environment Variables - Type-safe configuration
// =============================================

import { type NodeEnvType } from 'sakalsense-core';

export const NODE_ENV: NodeEnvType = (process.env.NODE_ENV as NodeEnvType) ?? 'development';
export const IS_PRODUCTION: boolean = NODE_ENV === 'production';
export const IS_DEVELOPMENT: boolean = NODE_ENV === 'development';

export const API_URL: string = process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/api` : 'http://localhost:8000/api';

// Validation - fails fast on missing required variables
export const validateEnv = (): void => {
    if (IS_PRODUCTION) {
        const required = ['NEXT_PUBLIC_API_URL'];
        const missing = required.filter((key) => !process.env[key]);
        if (missing.length > 0) throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
};

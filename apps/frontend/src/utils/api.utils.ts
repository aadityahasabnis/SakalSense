// =============================================
// API Utilities - Shared utilities for API calls
// =============================================

import { IS_DEVELOPMENT } from '@/env';
import { type FormDataType } from '@/types/common.types';

// =============================================
// Configuration
// =============================================

export const API_CONFIG = {
    timeout: 30000, // 30 seconds
} as const;

// =============================================
// Types
// =============================================

export interface ILogData {
    method: string;
    url: string;
    status: number;
    duration: number;
    body?: unknown;
    response?: unknown;
    error?: string;
    host?: string;
}

// =============================================
// Logging Utilities
// =============================================

export const logApiCall = (logData: ILogData, prefix = 'API'): void => {
    if (!IS_DEVELOPMENT) return;

    const timestamp = new Date().toISOString();
    const errorMsg = logData.error ? `\nError: ${logData.error}` : '';
    console.log(`[${prefix} ${timestamp}] ${logData.method} ${logData.url} - ${logData.status} (${logData.duration}ms)${errorMsg}`);
};

// =============================================
// Helper Functions
// =============================================

export const formDataToJson = (formData: FormData): FormDataType => {
    const json: FormDataType = {};
    formData.forEach((value, key) => {
        json[key] = value;
    });
    return json;
};

// =============================================
// Request Utilities
// =============================================

export const createAbortController = (timeout: number = API_CONFIG.timeout): { controller: AbortController; timeoutId: NodeJS.Timeout } => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    return { controller, timeoutId };
};

export const isAbortError = (error: unknown): boolean => {
    return error instanceof Error && error.name === 'AbortError';
};

export const getErrorMessage = (error: unknown): string => {
    return error instanceof Error ? error.message : 'Unknown error';
};

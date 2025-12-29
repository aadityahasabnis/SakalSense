'use server';

// =============================================
// API Client - Server action for making API calls
// =============================================

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { type HttpMethodType, type IApiResponse } from './interfaces';

import { API_URL, IS_DEVELOPMENT } from '@/env';
import { type FormDataType } from '@/types/common.types';

// API Configuration
const API_CONFIG = {
    timeout: 30000, // 30 seconds
} as const;

// =============================================
// Types & Interfaces
// =============================================

interface IApiRequest {
    method: HttpMethodType;
    url: string;
    authToken?: string;
}

interface IApiRequestWithBody extends IApiRequest {
    method: 'POST' | 'PUT' | 'DELETE';
    body: Record<string, unknown>;
}

interface IApiRequestWithFormData extends IApiRequest {
    method: 'POST' | 'PUT';
    formData: FormData;
}

export type IApiCallProps = IApiRequest | IApiRequestWithBody | IApiRequestWithFormData;

class RedirectError extends Error {
    constructor(public redirectTo: string) {
        super(`Redirecting to ${redirectTo}`);
        this.name = 'RedirectError';
    }
}

// =============================================
// Logging Utilities
// =============================================

interface ILogData {
    method: string;
    url: string;
    status: number;
    duration: number;
    body?: unknown;
    response?: unknown;
    error?: string;
    host?: string;
}

const logApiCall = async (logData: ILogData): Promise<void> => {
    if (!IS_DEVELOPMENT) return;

    const timestamp = new Date().toISOString();
    console.log(`[API ${timestamp}] ${logData.method} ${logData.url} - ${logData.status} (${logData.duration}ms)`, logData.error ? `\nError: ${logData.error}` : '');
};

// =============================================
// Helper Functions
// =============================================

const formDataToJson = (formData: FormData): FormDataType => {
    const json: FormDataType = {};
    formData.forEach((value, key) => {
        json[key] = value;
    });
    return json;
};

// =============================================
// Main API Call Function
// =============================================

export const apiCall = async <T = FormDataType>(props: IApiCallProps): Promise<IApiResponse<T>> => {
    const start = Date.now();
    const { method, url, authToken: customAuthToken } = props;

    // Get headers and host information
    const headersList = await headers();
    const host = headersList.get('host') ?? '';
    const authToken = customAuthToken;

    // Extract body from either formData or body property
    const body = 'formData' in props && props.formData ? formDataToJson(props.formData) : 'body' in props && props.body ? props.body : undefined;

    const fullUrl = `${API_URL}${url}`;

    try {
        // Setup request options
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);

        const requestOptions: RequestInit = {
            method,
            body: body ? JSON.stringify(body) : undefined,
            headers: {
                'Content-Type': 'application/json',
                ...(authToken && { Authorization: `Bearer ${authToken}` }),
                Referer: host,
            },
            credentials: 'include',
            signal: controller.signal,
        };

        // Make the API call
        const response = await fetch(fullUrl, requestOptions);
        clearTimeout(timeoutId);

        // Parse response
        const responseData = (await response.json()) as IApiResponse<T>;
        const duration = Date.now() - start;

        // Log the API call
        await logApiCall({
            method,
            url: fullUrl,
            status: response.status,
            duration,
            body,
            response: responseData,
            host,
        });

        // Handle 403 Unauthorized - trigger redirect
        if (response.status === 403) {
            throw new RedirectError(responseData.message ?? '/login');
        }

        // Handle validation errors in development
        if (response.status === 422 && IS_DEVELOPMENT) {
            return {
                status: 422,
                message: `Validation Error: ${responseData.message ?? responseData.error}`,
                success: false,
            };
        }

        // Return response with proper structure
        if (responseData.message) {
            return {
                status: response.status,
                success: responseData.success,
                message: responseData.message,
                data: responseData.data,
            };
        }

        if (responseData.error) {
            return {
                status: response.status,
                success: false,
                error: responseData.error,
            };
        }

        return {
            ...responseData,
            success: response.ok && responseData.success !== false,
        };
    } catch (error) {
        const duration = Date.now() - start;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        // Log the error
        await logApiCall({
            method,
            url: fullUrl,
            status: 500,
            duration,
            body,
            error: errorMessage,
            host,
        });

        // Handle redirect errors
        if (error instanceof RedirectError) {
            redirect(error.redirectTo);
        }

        // Handle abort errors
        if (error instanceof Error && error.name === 'AbortError') {
            return {
                status: 408,
                success: false,
                error: 'Request timeout',
            };
        }

        // Generic error response
        return {
            status: 500,
            success: false,
            error: 'An internal server error occurred',
        };
    }
};

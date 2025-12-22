'use server';

// API wrapper - Server action for making API calls
// Handles authentication, error handling, and logging

import { API_CONFIG, type IApiRequest, type IApiResponse, type IFormData } from '@sakalsense/core';

const API_BASE_URL = process.env.API_URL ?? 'http://localhost:8000/api';

// apiCall: Server action for API requests
// Returns typed response with success/error handling
export const apiCall = async <T = IFormData>(props: IApiRequest): Promise<IApiResponse<T>> => {
    const start = Date.now();
    const { method, url, body, headers: customHeaders } = props;
    const fullUrl = `${API_BASE_URL}${url}`;

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);

        const response = await fetch(fullUrl, {
            method,
            body: body ? JSON.stringify(body) : undefined,
            headers: {
                'Content-Type': 'application/json',
                ...customHeaders,
            },
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const data = (await response.json()) as IApiResponse<T>;
        const duration = Date.now() - start;

        // Log in development
        if (process.env.NODE_ENV === 'development') {
            console.log(`[API] ${method} ${url} - ${response.status} (${duration}ms)`);
        }

        return {
            status: response.status,
            success: response.ok && data.success !== false,
            data: data.data,
            message: data.message,
            error: data.error,
            metadata: data.metadata,
        };
    } catch (error) {
        const duration = Date.now() - start;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        console.error(`[API] ${method} ${url} - Error (${duration}ms):`, errorMessage);

        return {
            status: 500,
            success: false,
            error: errorMessage === 'This operation was aborted' ? 'Request timeout' : errorMessage,
        };
    }
};

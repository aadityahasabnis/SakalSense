// =============================================
// API Client - Client-side HTTP utility
// =============================================

import { type HttpMethodType, type IApiResponse } from './interfaces';

import { API_URL } from '@/env';
import { createAbortController, getErrorMessage, isAbortError, logApiCall } from '@/utils/api.utils';

// =============================================
// Types
// =============================================

interface IApiRequest {
    method: HttpMethodType;
    url: string;
    headers?: Record<string, string>;
}

interface IApiRequestWithBody extends IApiRequest {
    method: 'POST' | 'PUT' | 'DELETE';
    body: Record<string, unknown>;
}

export type IClientApiCallProps = IApiRequest | IApiRequestWithBody;

// =============================================
// Main API Call Function
// =============================================

export const clientApiCall = async <TData>(props: IClientApiCallProps): Promise<IApiResponse<TData>> => {
    const start = Date.now();
    const { method, url, headers: customHeaders = {} } = props;

    const body = 'body' in props && props.body ? props.body : undefined;
    const fullUrl = `${API_URL}${url}`;

    try {
        // Setup request with timeout
        const { controller, timeoutId } = createAbortController();

        const requestOptions: RequestInit = {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...customHeaders,
            },
            credentials: 'include', // Critical: Enables cookie handling
            body: body ? JSON.stringify(body) : undefined,
            signal: controller.signal,
        };

        // Make the API call
        const response = await fetch(fullUrl, requestOptions);
        clearTimeout(timeoutId);

        // Parse response
        const responseData = (await response.json()) as IApiResponse<TData>;
        const duration = Date.now() - start;

        // Log the API call
        logApiCall(
            {
                method,
                url: fullUrl,
                status: response.status,
                duration,
                body,
                response: responseData,
            },
            'CLIENT API',
        );

        // Return structured response with all fields from backend
        return {
            status: response.status,
            success: response.ok && responseData.success !== false,
            message: responseData.message,
            error: responseData.error,
            data: responseData.data,
        };
    } catch (error) {
        const duration = Date.now() - start;
        const errorMessage = getErrorMessage(error);

        // Log the error
        logApiCall(
            {
                method,
                url: fullUrl,
                status: 500,
                duration,
                body,
                error: errorMessage,
            },
            'CLIENT API',
        );

        // Handle abort/timeout errors
        if (isAbortError(error)) {
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
            error: errorMessage,
        };
    }
};

// =============================================
// Convenience Methods
// =============================================

export const clientApi = {
    get: <TData>(url: string, headers?: Record<string, string>): Promise<IApiResponse<TData>> => clientApiCall<TData>({ method: 'GET', url, headers }),

    post: <TData>(url: string, body: Record<string, unknown>, headers?: Record<string, string>): Promise<IApiResponse<TData>> =>
        clientApiCall<TData>({ method: 'POST', url, body, headers }),

    put: <TData>(url: string, body: Record<string, unknown>, headers?: Record<string, string>): Promise<IApiResponse<TData>> =>
        clientApiCall<TData>({ method: 'PUT', url, body, headers }),

    delete: <TData>(url: string, body?: Record<string, unknown>, headers?: Record<string, string>): Promise<IApiResponse<TData>> => {
        if (body) {
            return clientApiCall<TData>({ method: 'DELETE', url, body, headers });
        }
        return clientApiCall<TData>({ method: 'DELETE', url, headers });
    },
};

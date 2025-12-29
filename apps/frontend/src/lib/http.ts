/**
 * HTTP Client - Browser-side API client for direct fetch calls
 * @description Used for authentication endpoints where cookies must be set in the browser
 * @module lib/http
 */

import { type IApiResponse } from './interfaces';

import { API_URL } from '@/env';

// ─────────────────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

interface RequestOptions {
    body?: Record<string, unknown>;
    headers?: Record<string, string>;
}

// ─────────────────────────────────────────────────────────────────────────────
// HTTP Client
// ─────────────────────────────────────────────────────────────────────────────

const request = async <T>(method: HttpMethod, endpoint: string, options: RequestOptions = {}): Promise<IApiResponse<T>> => {
    const { body, headers = {} } = options;

    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...headers,
            },
            credentials: 'include', // Critical: Enables cookie handling
            body: body ? JSON.stringify(body) : undefined,
        });

        const data = (await response.json()) as IApiResponse<T>;
        return data;
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Network error occurred',
        };
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// Exported Methods
// ─────────────────────────────────────────────────────────────────────────────

export const http = {
    get: <T>(endpoint: string, options?: Omit<RequestOptions, 'body'>) => request<T>('GET', endpoint, options),

    post: <T>(endpoint: string, body?: Record<string, unknown>, options?: Omit<RequestOptions, 'body'>) => request<T>('POST', endpoint, { ...options, body }),

    put: <T>(endpoint: string, body?: Record<string, unknown>, options?: Omit<RequestOptions, 'body'>) => request<T>('PUT', endpoint, { ...options, body }),

    delete: <T>(endpoint: string, options?: RequestOptions) => request<T>('DELETE', endpoint, options),
};

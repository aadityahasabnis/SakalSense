// API interfaces - Type definitions for API requests and responses
// Used across frontend and backend for type-safe API communication

import { type IFormData } from '../types';

// HTTP methods
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

// API request configuration
export interface IApiRequest {
    method: HttpMethod;
    url: string;
    body?: IFormData;
    headers?: Record<string, string>;
}

// API response structure
export interface IApiResponse<T = IFormData> {
    status: number;
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
    metadata?: {
        id?: string;
        count?: number;
        page?: number;
        totalPages?: number;
    };
}

// API state for hooks
export interface IApiState<T = IFormData> {
    data: T | null;
    loading: boolean;
    error: string | null;
}

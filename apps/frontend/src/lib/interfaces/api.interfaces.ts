// =============================================
// API Interfaces - Request/Response structures
// =============================================

import { type ISession } from './auth.interfaces';

import { type IFormData } from '@/types/common.types';

// HTTP method type
export type HttpMethodType = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

// API request configuration
export interface IApiRequest {
    method: HttpMethodType;
    url: string;
    body?: IFormData;
    headers?: Record<string, string>;
}

// API response structure
export interface IApiResponse<T = IFormData> {
    status?: number;
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
    sessionLimitExceeded?: boolean;
    activeSessions?: Array<ISession>;
}

// API state for hooks
export interface IApiState<T = IFormData> {
    data: T | null;
    loading: boolean;
    error: string | null;
}

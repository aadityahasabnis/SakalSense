// =============================================
// HTTP Interfaces - Response structures with strict typing
// =============================================

import { type HealthStatusType, type FormDataType } from './common.types';

// IActionSuccessResponse: Used when API call succeeds
interface IActionSuccessResponse<TData extends FormDataType | Array<FormDataType> | undefined = undefined> {
    success: true;
    data?: TData;
}

// IActionMessageResponse: Used for user-facing failure messages (e.g., "Email already exists")
// message: Human-readable string for UI display
interface IActionMessageResponse {
    success: false;
    message: string;
}

// IActionErrorResponse: Used for system/technical errors (e.g., "Database connection failed")
// error: Technical error string, may be logged or shown in dev mode only
interface IActionErrorResponse {
    success: false;
    error: string;
}

// IActionResponse: Union type combining all response variants
export type IActionResponse<TData extends FormDataType | Array<FormDataType> | undefined = undefined> = Promise<IActionSuccessResponse<TData> | IActionErrorResponse | IActionMessageResponse>;

// IHealthResponse: Dedicated interface for health check endpoint
export interface IHealthResponse {
    status: HealthStatusType;
    timestamp: string;
    uptime: string;
    services: {
        mongodb: 'connected' | 'disconnected';
        redis: 'connected' | 'disconnected';
    };
}

// IPaginationMeta: Metadata for paginated responses
// Separate interface allows reuse across different paginated endpoints
export interface IPaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

// IPaginatedResponse: Extends success response with pagination metadata
export interface IPaginatedResponse<TData extends FormDataType> extends Omit<IActionSuccessResponse<TData>, 'data'> {
    data: Array<TData>;
    meta: IPaginationMeta;
}

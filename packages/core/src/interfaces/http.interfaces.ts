// HTTP response interfaces with strict typing for API consistency
// Follows discriminated union pattern: success field determines available properties

import { type HelthType, type IFormData } from '../types';

// IActionSuccessResponse: Used when API call succeeds
// TData extends constraint ensures type safety for response data
// Default undefined allows success responses without data (e.g., DELETE operations)
interface IActionSuccessResponse<TData extends IFormData | Array<IFormData> | undefined = undefined> {
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
// Promise wrapper ensures async handling consistency across all API calls
// Discriminated union on 'success' allows TypeScript to narrow types in conditionals
export type IActionResponse<TData extends IFormData | Array<IFormData> | undefined = undefined> =
    Promise<IActionSuccessResponse<TData> | IActionErrorResponse | IActionMessageResponse>;

// IHealthResponse: Dedicated interface for health check endpoint
// status: Binary health indicator for load balancer compatibility
// services: Individual service status for debugging connectivity issues
export interface IHealthResponse {
    status: HelthType;
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
// Omit<> removes 'data' from base type to redefine it as Array<TData>
export interface IPaginatedResponse<TData extends IFormData> extends Omit<IActionSuccessResponse<TData>, 'data'> {
    data: Array<TData>;
    meta: IPaginationMeta;
}

// =============================================
// HTTP Constants - Status codes and error messages
// =============================================

// HTTP_STATUS: Standard HTTP status codes as constants
// Prevents magic numbers in codebase, enables autocomplete, and ensures consistency
export const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503,
} as const;

// HttpStatus: Type derived from HTTP_STATUS values for type-safe status code usage
export type HttpStatus = (typeof HTTP_STATUS)[keyof typeof HTTP_STATUS];

// HTTP_ERROR_MESSAGES: Error messages for failure responses (success: false)
// Only used when returning error/message in failed responses
export const HTTP_ERROR_MESSAGES = {
    BAD_REQUEST: 'Invalid request data',
    UNAUTHORIZED: 'Authentication required',
    FORBIDDEN: 'Access denied',
    NOT_FOUND: 'Resource not found',
    CONFLICT: 'Resource already exists',
    INTERNAL_ERROR: 'An unexpected error occurred',
    SERVICE_UNAVAILABLE: 'Service temporarily unavailable',
} as const;

// HTTP_METHOD: Standard HTTP methods for type-safe usage
export const HTTP_METHOD = {
    GET: 'GET',
    POST: 'POST',
    PUT: 'PUT',
    PATCH: 'PATCH',
    DELETE: 'DELETE',
} as const;

export type HttpMethod = (typeof HTTP_METHOD)[keyof typeof HTTP_METHOD];

// Debug Log Configuration - API request/response logging
export const DEBUG_LOG_TTL = 604800; // 7 days in seconds
export const DEBUG_LOG_KEY_PREFIX = 'debuglog';
export const DEBUG_LOG_EXCLUDED_PATHS = ['/api/health'] as const;

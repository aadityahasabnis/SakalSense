// =============================================
// HTTP Constants - Status codes and error messages
// =============================================

// HTTP status codes
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

export type HttpStatusType = (typeof HTTP_STATUS)[keyof typeof HTTP_STATUS];

// HTTP error messages
export const HTTP_ERROR = {
    BAD_REQUEST: 'Invalid request data',
    UNAUTHORIZED: 'Authentication required',
    FORBIDDEN: 'Access denied',
    NOT_FOUND: 'Resource not found',
    CONFLICT: 'Resource already exists',
    TOO_MANY_REQUESTS: 'Too many requests. Please try again later.',
    INTERNAL_ERROR: 'An unexpected error occurred',
    SERVICE_UNAVAILABLE: 'Service temporarily unavailable',
} as const;

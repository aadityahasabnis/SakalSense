// Global error handler middleware - catches all errors and returns consistent response
// Must be registered LAST in middleware chain to catch errors from all routes

import { type Request, type Response, type NextFunction } from 'express';

import { NODE_ENV } from '../config';
import { HTTP_ERROR_MESSAGES, HTTP_STATUS } from '@sakalsense/core';

// errorHandler: Centralized error handling for consistent API error responses
// Underscore prefix (_req, _next): Convention indicating parameter is required by Express signature but unused
export const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction): void => {
    console.error('[Error]', err.stack);

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: NODE_ENV === 'development' ? err.message : HTTP_ERROR_MESSAGES.INTERNAL_ERROR,
    });
};

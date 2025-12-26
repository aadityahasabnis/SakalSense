// =============================================
// Error Handler - Global error handling middleware
// =============================================

import { type Request, type Response, type NextFunction } from 'express';

import { HTTP_ERROR_MESSAGES, HTTP_STATUS } from '@sakalsense/core';

import { NODE_ENV } from '../config';

export const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction): void => {
    console.error('[Error]', err.stack);

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: NODE_ENV === 'development' ? err.message : HTTP_ERROR_MESSAGES.INTERNAL_ERROR,
    });
};

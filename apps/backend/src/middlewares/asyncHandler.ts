// =============================================
// Async Handler - Wraps async route handlers to catch errors
// =============================================

import { type Request, type Response, type NextFunction, type RequestHandler } from 'express';

export const asyncHandler =
    (fn: RequestHandler): RequestHandler =>
    (req: Request, res: Response, next: NextFunction) =>
        Promise.resolve(fn(req, res, next)).catch(next);

// Async handler middleware - wraps async route handlers to catch errors automatically
// Eliminates try-catch boilerplate in every route, errors flow to global errorHandler

import { type Request, type Response, type NextFunction, type RequestHandler } from 'express';

// asyncHandler: Higher-order function that wraps async handlers
// Promise.resolve() ensures sync errors are also caught and forwarded to next()
// One-liner arrow function for maximum conciseness while maintaining readability
export const asyncHandler = (fn: RequestHandler): RequestHandler => (req: Request, res: Response, next: NextFunction) => Promise.resolve(fn(req, res, next)).catch(next);

// Request logger middleware - logs HTTP requests with method, path, status, and duration
// Useful for debugging, monitoring, and performance analysis

import { type Request, type Response, type NextFunction } from 'express';

// requestLogger: Logs request details after response is sent
// res.on('finish') ensures status code is available (set during response)
// Duration calculated using high-resolution time for accuracy
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`[${req.method}] ${req.path} - ${res.statusCode} (${duration}ms)`);
    });

    next();
};

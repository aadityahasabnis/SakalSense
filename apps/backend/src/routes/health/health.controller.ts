// =============================================
// Health Controller - Returns system health status
// =============================================

import { type Request, type Response } from 'express';

import { formatDate, formatDuration, HTTP_STATUS, type IHealthResponse } from '@sakalsense/core';

import { isMongoDBConnected } from '../../db/mongodb';
import { isRedisConnected } from '../../db/redis';

export const getHealth = (_req: Request, res: Response<IHealthResponse>): void => {
    res.status(HTTP_STATUS.OK).json({
        status: 'healthy',
        timestamp: formatDate(new Date().toISOString(), { includeTime: true, includeWeekday: true }),
        uptime: formatDuration(process.uptime(), { short: true }),
        services: {
            mongodb: isMongoDBConnected() ? 'connected' : 'disconnected',
            redis: isRedisConnected() ? 'connected' : 'disconnected',
        },
    });
};

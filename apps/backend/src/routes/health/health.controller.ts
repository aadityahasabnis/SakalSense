// =============================================
// Health Controller - Returns system health status
// =============================================

import { type Request, type Response } from 'express';

import { isMongoDBConnected } from '../../db/mongodb.js';
import { isRedisConnected } from '../../db/redis.js';
import { HTTP_STATUS } from '@/constants/http.constants.js';
import { formatDate, formatDuration } from '@/utils/date.utils.js';
import { type IHealthResponse } from '@/lib/interfaces/http.interfaces.js';

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

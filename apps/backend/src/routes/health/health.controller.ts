// =============================================
// Health Controller - Returns system health status
// =============================================

import { HTTP_STATUS } from '@/constants/http.constants';
import { isMongoDBConnected, isRedisConnected } from '@/db';
import { type IHealthResponse } from '@/lib/interfaces/http.interfaces';
import { formatDate, formatDuration } from '@/utils/date.utils';
import { type Request, type Response } from 'express';


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

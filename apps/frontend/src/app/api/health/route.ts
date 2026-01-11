// =============================================
// Health API Route - System health check
// =============================================

import { NextResponse } from 'next/server';

import { getRedis, isRedisConnected } from '@/server/db/redis';
import { formatDate, formatDuration } from '@/utils/date.utils';

// IHealthResponse: Health check response
interface IHealthResponse {
    status: 'healthy' | 'degraded';
    timestamp: string;
    uptime: string;
    services: { database: 'accelerate'; redis: 'connected' | 'disconnected' };
}

export const GET = async (): Promise<NextResponse<IHealthResponse>> => {
    // Check Redis connection
    if (!isRedisConnected()) {
        try {
            await getRedis();
        } catch (err) {
            console.error('[Health] Redis connection failed:', err);
        }
    }

    const redisStatus = isRedisConnected() ? 'connected' : 'disconnected';

    return NextResponse.json({
        status: redisStatus === 'connected' ? 'healthy' : 'degraded',
        timestamp: formatDate(new Date(), { includeTime: true, includeSeconds: true }),
        uptime: formatDuration(process.uptime(), { short: true }),
        services: { database: 'accelerate', redis: redisStatus },
    });
};

// =============================================
// Health API Route - System health check
// =============================================

import { NextResponse } from 'next/server';

import { isRedisConnected } from '@/server/db/redis';

// IHealthResponse: Health check response
interface IHealthResponse {
    status: 'healthy' | 'degraded';
    timestamp: string;
    uptime: string;
    services: { database: 'connected' | 'not_checked'; redis: 'connected' | 'disconnected' };
}

// formatUptime: Format seconds to human readable
const formatUptime = (seconds: number): string => {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const parts: Array<string> = [];
    if (d > 0) parts.push(`${d}d`);
    if (h > 0) parts.push(`${h}h`);
    if (m > 0) parts.push(`${m}m`);
    if (s > 0 && d === 0) parts.push(`${s}s`);
    return parts.join(' ') || '0s';
};

export const GET = async (): Promise<NextResponse<IHealthResponse>> => {
    const redisStatus = isRedisConnected() ? 'connected' : 'disconnected';

    return NextResponse.json({
        status: redisStatus === 'connected' ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        uptime: formatUptime(process.uptime()),
        services: {
            database: 'not_checked', // Prisma connections are pooled, check done at query time
            redis: redisStatus,
        },
    });
};

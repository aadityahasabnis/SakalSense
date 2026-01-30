'use server';

import { STAKEHOLDER } from '@/constants/auth.constants';
import  { type ContentStatusType } from '@/constants/content.constants';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/server/db/prisma';

interface IDashboardStats { totalContent: number; totalViews: number; totalLikes: number; publishedCount: number; draftCount: number; reviewCount: number }
interface IDashboardResponse { success: boolean; data?: IDashboardStats; error?: string }
interface IRecentContentResponse { success: boolean; data?: Array<{ id: string; title: string; type: string; status: ContentStatusType; viewCount: number; createdAt: Date }>; error?: string }

// Get dashboard stats
export const getDashboardStats = async (): Promise<IDashboardResponse> => {
    try {
        const user = await getCurrentUser(STAKEHOLDER.ADMIN);
        if (!user) return { success: false, error: 'Unauthorized' };

        const where = { creatorId: user.userId };
        const [totalContent, publishedCount, draftCount, reviewCount, aggregate] = await Promise.all([
            prisma.content.count({ where }),
            prisma.content.count({ where: { ...where, status: 'PUBLISHED' } }),
            prisma.content.count({ where: { ...where, status: 'DRAFT' } }),
            prisma.content.count({ where: { ...where, status: 'REVIEW' } }),
            prisma.content.aggregate({ where, _sum: { viewCount: true, likeCount: true } }),
        ]);

        return { success: true, data: { totalContent, totalViews: aggregate._sum.viewCount ?? 0, totalLikes: aggregate._sum.likeCount ?? 0, publishedCount, draftCount, reviewCount } };
    } catch (error) { console.error('getDashboardStats error:', error); return { success: false, error: 'Failed to fetch stats' }; }
};

// Get recent content
export const getRecentContent = async (limit = 5): Promise<IRecentContentResponse> => {
    try {
        const user = await getCurrentUser(STAKEHOLDER.ADMIN);
        if (!user) return { success: false, error: 'Unauthorized' };

        const data = await prisma.content.findMany({ where: { creatorId: user.userId }, select: { id: true, title: true, type: true, status: true, viewCount: true, createdAt: true }, orderBy: { createdAt: 'desc' }, take: limit });
        return { success: true, data: data as Array<{ id: string; title: string; type: string; status: ContentStatusType; viewCount: number; createdAt: Date }> };
    } catch (error) { console.error('getRecentContent error:', error); return { success: false, error: 'Failed to fetch recent content' }; }
};

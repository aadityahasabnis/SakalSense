'use server';
// =============================================
// Public Series Actions - For end users to browse and view series
// =============================================

import { type ContentType } from '@/constants/content.constants';
import { prisma } from '@/server/db/prisma';
import { type ISeries, type ISeriesWithItems } from '@/types/content.types';

// =============================================
// Response Types
// =============================================

interface IPublicSeriesListResponse {
    success: boolean;
    data?: Array<ISeries>;
    total?: number;
    error?: string;
}

interface IPublicSeriesResponse {
    success: boolean;
    data?: ISeriesWithItems;
    error?: string;
}

// =============================================
// Get Published Series List (Public)
// =============================================

export const getPublicSeriesList = async (filters: {
    search?: string;
    contentType?: ContentType;
    page?: number;
    limit?: number;
}): Promise<IPublicSeriesListResponse> => {
    try {
        const { search = '', contentType, page = 1, limit = 20 } = filters;

        const where: Record<string, unknown> = {
            status: 'PUBLISHED',
            isPublished: true,
            ...(search && {
                OR: [
                    { title: { contains: search, mode: 'insensitive' as const } },
                    { slug: { contains: search, mode: 'insensitive' as const } },
                    { description: { contains: search, mode: 'insensitive' as const } },
                ],
            }),
            ...(contentType && { contentType }),
        };

        const [data, total] = await Promise.all([
            prisma.series.findMany({
                where,
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    description: true,
                    thumbnailUrl: true,
                    contentType: true,
                    status: true,
                    isPublished: true,
                    createdAt: true,
                    updatedAt: true,
                    creator: {
                        select: {
                            fullName: true,
                            avatarLink: true,
                        },
                    },
                    _count: {
                        select: {
                            items: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
                cacheStrategy: { ttl: 60, swr: 30 },
            }),
            prisma.series.count({ where }),
        ]);

        return {
            success: true,
            data: data as unknown as Array<ISeries>,
            total,
        };
    } catch (error) {
        console.error('getPublicSeriesList error:', error);
        return { success: false, error: 'Failed to fetch series' };
    }
};

// =============================================
// Get Series By Slug (Public)
// =============================================

export const getSeriesBySlug = async (slug: string): Promise<IPublicSeriesResponse> => {
    try {
        const series = await prisma.series.findFirst({
            where: {
                slug,
                status: 'PUBLISHED',
                isPublished: true,
            },
            include: {
                items: {
                    orderBy: { order: 'asc' },
                    include: {
                        content: {
                            select: {
                                id: true,
                                title: true,
                                slug: true,
                                description: true,
                                excerpt: true,
                                type: true,
                                status: true,
                                difficulty: true,
                                thumbnailUrl: true,
                                viewCount: true,
                                likeCount: true,
                                createdAt: true,
                                publishedAt: true,
                                creator: {
                                    select: {
                                        fullName: true,
                                        avatarLink: true,
                                    },
                                },
                            },
                        },
                    },
                },
                creator: {
                    select: {
                        id: true,
                        fullName: true,
                        avatarLink: true,
                    },
                },
            },
        });

        if (!series) {
            return { success: false, error: 'Series not found' };
        }

        return {
            success: true,
            data: series as unknown as ISeriesWithItems,
        };
    } catch (error) {
        console.error('getSeriesBySlug error:', error);
        return { success: false, error: 'Failed to fetch series' };
    }
};

// =============================================
// Get Featured Series
// =============================================

export const getFeaturedSeries = async (limit = 5): Promise<IPublicSeriesListResponse> => {
    try {
        const data = await prisma.series.findMany({
            where: {
                status: 'PUBLISHED',
                isPublished: true,
            },
            select: {
                id: true,
                title: true,
                slug: true,
                description: true,
                thumbnailUrl: true,
                contentType: true,
                createdAt: true,
                creator: {
                    select: {
                        fullName: true,
                        avatarLink: true,
                    },
                },
                _count: {
                    select: {
                        items: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
            cacheStrategy: { ttl: 300, swr: 60 },
        });

        return {
            success: true,
            data: data as unknown as Array<ISeries>,
            total: data.length,
        };
    } catch (error) {
        console.error('getFeaturedSeries error:', error);
        return { success: false, error: 'Failed to fetch featured series' };
    }
};

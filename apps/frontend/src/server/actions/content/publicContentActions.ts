'use server';
// =============================================
// Public Content Actions - For end users to browse and read content
// =============================================

import { type ContentType, type DifficultyType } from '@/constants/content.constants';
import { prisma } from '@/server/db/prisma';
import { type IContentListItem, type IContentWithRelations } from '@/types/content.types';

// =============================================
// Response Types
// =============================================

interface IPublicContentListResponse {
    success: boolean;
    data?: Array<IContentListItem>;
    total?: number;
    error?: string;
}

interface IPublicContentResponse {
    success: boolean;
    data?: IContentWithRelations;
    error?: string;
}

interface IContentViewResponse {
    success: boolean;
    error?: string;
}

// =============================================
// Get Published Content List (Public Browse)
// =============================================

export const getPublicContentList = async (filters: {
    search?: string;
    type?: ContentType;
    difficulty?: DifficultyType;
    categoryId?: string;
    topicIds?: Array<string>;
    page?: number;
    limit?: number;
    sortField?: string;
    sortDir?: 'asc' | 'desc';
}): Promise<IPublicContentListResponse> => {
    try {
        const {
            search = '',
            type,
            difficulty,
            categoryId,
            topicIds,
            page = 1,
            limit = 20,
            sortField = 'publishedAt',
            sortDir = 'desc',
        } = filters;

        const where: Record<string, unknown> = {
            status: 'PUBLISHED', // Only show published content
            ...(search && {
                OR: [
                    { title: { contains: search, mode: 'insensitive' as const } },
                    { slug: { contains: search, mode: 'insensitive' as const } },
                    { description: { contains: search, mode: 'insensitive' as const } },
                ],
            }),
            ...(type && { type }),
            ...(difficulty && { difficulty }),
            ...(categoryId && { categoryId }),
            ...(topicIds && topicIds.length > 0 && {
                topics: {
                    some: {
                        topicId: { in: topicIds },
                    },
                },
            }),
        };

        const [data, total] = await Promise.all([
            prisma.content.findMany({
                where,
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
                    commentCount: true,
                    createdAt: true,
                    publishedAt: true,
                    creator: {
                        select: {
                            fullName: true,
                            avatarLink: true,
                        },
                    },
                    category: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                        },
                    },
                },
                orderBy: { [sortField]: sortDir },
                skip: (page - 1) * limit,
                take: limit,
                cacheStrategy: { ttl: 60, swr: 30 },
            }),
            prisma.content.count({ where }),
        ]);

        return {
            success: true,
            data: data as unknown as Array<IContentListItem>,
            total,
        };
    } catch (error) {
        console.error('getPublicContentList error:', error);
        return { success: false, error: 'Failed to fetch content' };
    }
};

// =============================================
// Get Content By Slug (Public View)
// =============================================

export const getContentBySlug = async (slug: string, userId?: string): Promise<IPublicContentResponse> => {
    try {
        const content = await prisma.content.findFirst({
            where: {
                slug,
                status: 'PUBLISHED',
            },
            include: {
                creator: {
                    select: {
                        id: true,
                        fullName: true,
                        avatarLink: true,
                    },
                },
                category: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                    },
                },
                topics: {
                    include: {
                        topic: {
                            select: {
                                id: true,
                                name: true,
                                slug: true,
                            },
                        },
                    },
                },
            },
        });

        if (!content) {
            return { success: false, error: 'Content not found' };
        }

        // Transform topics to flat array
        const data: IContentWithRelations = {
            ...content,
            topics: content.topics.map((t: { topic: { id: string; name: string; slug: string } }) => t.topic),
        } as unknown as IContentWithRelations;

        return { success: true, data };
    } catch (error) {
        console.error('getContentBySlug error:', error);
        return { success: false, error: 'Failed to fetch content' };
    }
};

// =============================================
// Record Content View
// =============================================

export const recordContentView = async (contentId: string, userId?: string): Promise<IContentViewResponse> => {
    try {
        // Use transaction to ensure atomicity
        await prisma.$transaction(async (tx: typeof prisma) => {
            // Increment view count
            await tx.content.update({
                where: { id: contentId },
                data: {
                    viewCount: {
                        increment: 1,
                    },
                },
            });

            // Record view if user is logged in
            if (userId) {
                await tx.contentView.create({
                    data: {
                        userId,
                        contentId,
                    },
                });
            }
        });

        return { success: true };
    } catch (error) {
        console.error('recordContentView error:', error);
        return { success: false, error: 'Failed to record view' };
    }
};

// =============================================
// Get Featured Content
// =============================================

export const getFeaturedContent = async (limit = 5): Promise<IPublicContentListResponse> => {
    try {
        const data = await prisma.content.findMany({
            where: {
                status: 'PUBLISHED',
                isFeatured: true,
            },
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
                commentCount: true,
                createdAt: true,
                publishedAt: true,
                featuredAt: true,
                creator: {
                    select: {
                        fullName: true,
                        avatarLink: true,
                    },
                },
            },
            orderBy: { featuredAt: 'desc' },
            take: limit,
            cacheStrategy: { ttl: 300, swr: 60 },
        });

        return {
            success: true,
            data: data as unknown as Array<IContentListItem>,
            total: data.length,
        };
    } catch (error) {
        console.error('getFeaturedContent error:', error);
        return { success: false, error: 'Failed to fetch featured content' };
    }
};

// =============================================
// Get Trending Content (Most views in last 7 days)
// =============================================

export const getTrendingContent = async (limit = 10): Promise<IPublicContentListResponse> => {
    try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const data = await prisma.content.findMany({
            where: {
                status: 'PUBLISHED',
                publishedAt: {
                    gte: sevenDaysAgo,
                },
            },
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
                commentCount: true,
                createdAt: true,
                publishedAt: true,
                creator: {
                    select: {
                        fullName: true,
                        avatarLink: true,
                    },
                },
            },
            orderBy: [{ viewCount: 'desc' }, { likeCount: 'desc' }],
            take: limit,
            cacheStrategy: { ttl: 180, swr: 60 },
        });

        return {
            success: true,
            data: data as unknown as Array<IContentListItem>,
            total: data.length,
        };
    } catch (error) {
        console.error('getTrendingContent error:', error);
        return { success: false, error: 'Failed to fetch trending content' };
    }
};

// =============================================
// Get Related Content (by category and topics)
// =============================================

export const getRelatedContent = async (contentId: string, limit = 5): Promise<IPublicContentListResponse> => {
    try {
        // First get the content to find its category and topics
        const content = await prisma.content.findUnique({
            where: { id: contentId },
            select: {
                categoryId: true,
                topics: {
                    select: {
                        topicId: true,
                    },
                },
            },
        });

        if (!content) {
            return { success: false, error: 'Content not found' };
        }

        const topicIds = content.topics.map((t: { topicId: string }) => t.topicId);

        const data = await prisma.content.findMany({
            where: {
                status: 'PUBLISHED',
                id: { not: contentId },
                OR: [
                    { categoryId: content.categoryId },
                    {
                        topics: {
                            some: {
                                topicId: { in: topicIds },
                            },
                        },
                    },
                ],
            },
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
                commentCount: true,
                publishedAt: true,
                creator: {
                    select: {
                        fullName: true,
                        avatarLink: true,
                    },
                },
            },
            orderBy: { publishedAt: 'desc' },
            take: limit,
            cacheStrategy: { ttl: 120 },
        });

        return {
            success: true,
            data: data as unknown as Array<IContentListItem>,
            total: data.length,
        };
    } catch (error) {
        console.error('getRelatedContent error:', error);
        return { success: false, error: 'Failed to fetch related content' };
    }
};

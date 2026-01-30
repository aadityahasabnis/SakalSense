'use server';

// =============================================
// Content Query Actions - List and Get operations
// =============================================

import { STAKEHOLDER } from '@/constants/auth.constants';
import {
    type ContentStatusType,
    type ContentType,
    type DifficultyType,
} from '@/constants/content.constants';
import { getCurrentUser } from '@/lib/auth';
import { type IApiResponse } from '@/lib/interfaces';
import { prisma } from '@/server/db/prisma';
import {
    type IContentListItem,
    type IContentWithRelations,
} from '@/types/content.types';

// =============================================
// Type Definitions
// =============================================

export interface IContentListFilters {
    search?: string;
    type?: ContentType;
    status?: ContentStatusType;
    difficulty?: DifficultyType;
    page?: number;
    limit?: number;
    sortField?: string;
    sortDir?: 'asc' | 'desc';
}

export interface IContentListResponse {
    contents: Array<IContentListItem>;
    total: number;
    pages: number;
}

// =============================================
// List Content (with filters, search, pagination)
// =============================================

export const getContentList = async (
    filters: IContentListFilters = {},
): Promise<IApiResponse<IContentListResponse>> => {
    try {
        // Authentication check
        const user = await getCurrentUser(STAKEHOLDER.ADMIN);
        if (!user) {
            return {
                success: false,
                error: 'Unauthorized - Admin access required',
            };
        }

        // Destructure filters with defaults
        const {
            search = '',
            type,
            status,
            difficulty,
            page = 1,
            limit = 20,
            sortField = 'createdAt',
            sortDir = 'desc',
        } = filters;

        // Build where clause
        const where: Record<string, unknown> = {
            creatorId: user.userId,
        };

        // Add search filter
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' as const } },
                { slug: { contains: search, mode: 'insensitive' as const } },
            ];
        }

        // Add type filter
        if (type) {
            where.type = type;
        }

        // Add status filter
        if (status) {
            where.status = status;
        }

        // Add difficulty filter
        if (difficulty) {
            where.difficulty = difficulty;
        }

        // Calculate pagination
        const skip = (page - 1) * limit;

        // Execute queries in parallel for performance
        const [contents, total] = await Promise.all([
            prisma.content.findMany({
                where,
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    type: true,
                    status: true,
                    difficulty: true,
                    excerpt: true,
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
                skip,
                take: limit,
            }),
            prisma.content.count({ where }),
        ]);

        return {
            success: true,
            data: {
                contents: contents as unknown as Array<IContentListItem>,
                total,
                pages: Math.ceil(total / limit),
            },
        };
    } catch (error) {
        console.error('[getContentList] Error:', error);
        return {
            success: false,
            error: 'Failed to fetch content list',
        };
    }
};

// =============================================
// Get Single Content by ID
// =============================================

export const getContentById = async (
    id: string,
): Promise<IApiResponse<IContentWithRelations | null>> => {
    try {
        // Authentication check
        const user = await getCurrentUser(STAKEHOLDER.ADMIN);
        if (!user) {
            return {
                success: false,
                error: 'Unauthorized - Admin access required',
                data: null,
            };
        }

        // Fetch content with all relations
        const content = await prisma.content.findFirst({
            where: {
                id,
                creatorId: user.userId,
            },
            include: {
                creator: {
                    select: {
                        id: true,
                        fullName: true,
                        avatarLink: true,
                        bio: true,
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
            return {
                success: false,
                error: 'Content not found or you don\'t have permission to access it',
                data: null,
            };
        }

        // Transform topics from junction table format to flat array
        const transformedContent: IContentWithRelations = {
            ...content,
            topics: content.topics.map((ct: { topic: { id: string; name: string; slug: string } }) => ct.topic),
        } as unknown as IContentWithRelations;

        return {
            success: true,
            data: transformedContent,
        };
    } catch (error) {
        console.error('[getContentById] Error:', error);
        return {
            success: false,
            error: 'Failed to fetch content details',
            data: null,
        };
    }
};

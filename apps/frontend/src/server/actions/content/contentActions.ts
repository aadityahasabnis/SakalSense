'use server';

// =============================================
// Content Actions - CRUD operations for Admin creators
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
    type IContentInput,
    type IContentListItem,
    type IContentWithRelations,
} from '@/types/content.types';

// =============================================
// Type Definitions
// =============================================

interface IContentListFilters {
    search?: string;
    type?: ContentType;
    status?: ContentStatusType;
    difficulty?: DifficultyType;
    page?: number;
    limit?: number;
    sortField?: string;
    sortDir?: 'asc' | 'desc';
}

interface IContentListResponse {
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
        console.log('📋 [getContentList] Starting with filters:', filters);
        
        // Authentication check
        const user = await getCurrentUser(STAKEHOLDER.ADMIN);
        console.log('👤 [getContentList] User:', user);
        
        if (!user) {
            console.error('❌ [getContentList] No user found');
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
            creatorId: user.userId, // Only show content created by this admin
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

        console.log('📊 [getContentList] Found:', {
            count: contents.length,
            total,
            pages: Math.ceil(total / limit),
            where,
        });

        return {
            success: true,
            data: {
                contents: contents as unknown as Array<IContentListItem>,
                total,
                pages: Math.ceil(total / limit),
            },
        };
    } catch (error) {
        console.error('💥 [getContentList] Error:', error);
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
                creatorId: user.userId, // Ensure user can only access their own content
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

// =============================================
// Create New Content
// =============================================

export const createContent = async (
    input: IContentInput,
): Promise<IApiResponse<{ id: string }>> => {
    try {
        console.log('🔧 [createContent] Starting with input:', JSON.stringify(input, null, 2));
        
        // Authentication check
        const user = await getCurrentUser(STAKEHOLDER.ADMIN);
        console.log('👤 [createContent] User:', user);
        
        if (!user) {
            console.error('❌ [createContent] No user found');
            return {
                success: false,
                error: 'Unauthorized - Admin access required',
            };
        }

        // Verify admin exists and is active
        console.log('🔍 [createContent] Looking up admin:', user.userId);
        const admin = await prisma.admin.findUnique({
            where: { id: user.userId },
            select: { id: true, isActive: true },
        });
        console.log('👨‍💼 [createContent] Admin found:', admin);

        if (!admin) {
            console.error('❌ [createContent] Admin not found in database');
            return {
                success: false,
                error: 'Admin account not found. Please contact support.',
            };
        }

        if (!admin.isActive) {
            console.error('❌ [createContent] Admin account inactive');
            return {
                success: false,
                error: 'Your account is inactive. Please contact support.',
            };
        }

        // Check if slug already exists
        console.log('🔍 [createContent] Checking slug:', input.slug);
        const existingSlug = await prisma.content.findUnique({
            where: { slug: input.slug },
            select: { id: true },
        });

        if (existingSlug) {
            console.error('❌ [createContent] Slug already exists:', input.slug);
            return {
                success: false,
                error: `Slug "${input.slug}" is already in use. Please choose a different one.`,
            };
        }

        // Validate category if provided
        let validatedCategoryId: string | undefined;
        if (input.categoryId) {
            console.log('🔍 [createContent] Validating category:', input.categoryId);
            const category = await prisma.category.findUnique({
                where: { id: input.categoryId },
                select: { id: true },
            });

            if (!category) {
                console.error('❌ [createContent] Category not found:', input.categoryId);
                return {
                    success: false,
                    error: 'Selected category does not exist',
                };
            }

            validatedCategoryId = category.id;
        }

        // Validate topics if provided
        if (input.topicIds && input.topicIds.length > 0) {
            console.log('🔍 [createContent] Validating topics:', input.topicIds);
            const topics = await prisma.topic.findMany({
                where: {
                    id: { in: input.topicIds },
                },
                select: { id: true },
            });

            if (topics.length !== input.topicIds.length) {
                console.error('❌ [createContent] Some topics not found');
                return {
                    success: false,
                    error: 'One or more selected topics do not exist',
                };
            }
        }

        // Extract topicIds and categoryId from input
        const { topicIds, categoryId, ...contentData } = input;
        
        console.log('📝 [createContent] Creating content with data:', {
            ...contentData,
            creatorId: user.userId,
            categoryId: validatedCategoryId,
            topicCount: topicIds?.length || 0,
        });

        // Create content with relations
        const content = await prisma.content.create({
            data: {
                ...contentData,
                creatorId: user.userId,
                ...(validatedCategoryId && { categoryId: validatedCategoryId }),
                ...(topicIds &&
                    topicIds.length > 0 && {
                        topics: {
                            create: topicIds.map((topicId) => ({
                                topicId,
                            })),
                        },
                    }),
            },
            select: {
                id: true,
            },
        });

        console.log('✅ [createContent] Content created successfully:', content.id);

        return {
            success: true,
            data: { id: content.id },
            message: 'Content created successfully',
        };
    } catch (error) {
        console.error('💥 [createContent] Error:', error);
        return {
            success: false,
            error: 'Failed to create content. Please try again.',
        };
    }
};

// =============================================
// Update Existing Content
// =============================================

export const updateContent = async (
    id: string,
    input: Partial<IContentInput>,
): Promise<IApiResponse<{ id: string }>> => {
    try {
        // Authentication check
        const user = await getCurrentUser(STAKEHOLDER.ADMIN);
        if (!user) {
            return {
                success: false,
                error: 'Unauthorized - Admin access required',
            };
        }

        // Check if content exists and belongs to user
        const existingContent = await prisma.content.findFirst({
            where: {
                id,
                creatorId: user.userId,
            },
            select: {
                id: true,
                slug: true,
            },
        });

        if (!existingContent) {
            return {
                success: false,
                error: 'Content not found or you don\'t have permission to edit it',
            };
        }

        // Check slug uniqueness if changed
        if (input.slug && input.slug !== existingContent.slug) {
            const slugExists = await prisma.content.findFirst({
                where: {
                    slug: input.slug,
                    id: { not: id },
                },
                select: { id: true },
            });

            if (slugExists) {
                return {
                    success: false,
                    error: `Slug "${input.slug}" is already in use. Please choose a different one.`,
                };
            }
        }

        // Validate category if provided
        let validatedCategoryId: string | null | undefined;
        if (input.categoryId !== undefined) {
            if (input.categoryId) {
                const category = await prisma.category.findUnique({
                    where: { id: input.categoryId },
                    select: { id: true },
                });

                if (!category) {
                    return {
                        success: false,
                        error: 'Selected category does not exist',
                    };
                }

                validatedCategoryId = category.id;
            } else {
                // Explicitly setting to null to remove category
                validatedCategoryId = null;
            }
        }

        // Validate topics if provided
        if (input.topicIds && input.topicIds.length > 0) {
            const topics = await prisma.topic.findMany({
                where: {
                    id: { in: input.topicIds },
                },
                select: { id: true },
            });

            if (topics.length !== input.topicIds.length) {
                return {
                    success: false,
                    error: 'One or more selected topics do not exist',
                };
            }
        }

        // Extract topicIds and categoryId from input
        const { topicIds, categoryId, ...contentData } = input;

        // Update content
        await prisma.content.update({
            where: { id },
            data: {
                ...contentData,
                ...(categoryId !== undefined && {
                    categoryId: validatedCategoryId,
                }),
                ...(topicIds && {
                    topics: {
                        // Delete existing and create new
                        deleteMany: {},
                        create: topicIds.map((topicId) => ({
                            topicId,
                        })),
                    },
                }),
            },
        });

        return {
            success: true,
            data: { id },
            message: 'Content updated successfully',
        };
    } catch (error) {
        console.error('[updateContent] Error:', error);
        return {
            success: false,
            error: 'Failed to update content. Please try again.',
        };
    }
};

// =============================================
// Delete Content
// =============================================

export const deleteContent = async (
    id: string,
): Promise<IApiResponse<{ id: string }>> => {
    try {
        // Authentication check
        const user = await getCurrentUser(STAKEHOLDER.ADMIN);
        if (!user) {
            return {
                success: false,
                error: 'Unauthorized - Admin access required',
            };
        }

        // Check if content exists and belongs to user
        const existingContent = await prisma.content.findFirst({
            where: {
                id,
                creatorId: user.userId,
            },
            select: {
                id: true,
                title: true,
            },
        });

        if (!existingContent) {
            return {
                success: false,
                error: 'Content not found or you don\'t have permission to delete it',
            };
        }

        // Delete content (cascade will handle related records)
        await prisma.content.delete({
            where: { id },
        });

        return {
            success: true,
            data: { id },
            message: `"${existingContent.title}" has been deleted successfully`,
        };
    } catch (error) {
        console.error('[deleteContent] Error:', error);
        return {
            success: false,
            error: 'Failed to delete content. Please try again.',
        };
    }
};

// =============================================
// Publish Content
// =============================================

export const publishContent = async (
    id: string,
): Promise<IApiResponse<{ id: string }>> => {
    try {
        // Authentication check
        const user = await getCurrentUser(STAKEHOLDER.ADMIN);
        if (!user) {
            return {
                success: false,
                error: 'Unauthorized - Admin access required',
            };
        }

        // Check if content exists and belongs to user
        const existingContent = await prisma.content.findFirst({
            where: {
                id,
                creatorId: user.userId,
            },
            select: {
                id: true,
                title: true,
                status: true,
            },
        });

        if (!existingContent) {
            return {
                success: false,
                error: 'Content not found or you don\'t have permission to publish it',
            };
        }

        if (existingContent.status === 'PUBLISHED') {
            return {
                success: false,
                error: 'Content is already published',
            };
        }

        // Publish content
        await prisma.content.update({
            where: { id },
            data: {
                status: 'PUBLISHED',
                publishedAt: new Date(),
            },
        });

        return {
            success: true,
            data: { id },
            message: `"${existingContent.title}" has been published successfully`,
        };
    } catch (error) {
        console.error('[publishContent] Error:', error);
        return {
            success: false,
            error: 'Failed to publish content. Please try again.',
        };
    }
};

// =============================================
// Archive Content
// =============================================

export const archiveContent = async (
    id: string,
): Promise<IApiResponse<{ id: string }>> => {
    try {
        // Authentication check
        const user = await getCurrentUser(STAKEHOLDER.ADMIN);
        if (!user) {
            return {
                success: false,
                error: 'Unauthorized - Admin access required',
            };
        }

        // Check if content exists and belongs to user
        const existingContent = await prisma.content.findFirst({
            where: {
                id,
                creatorId: user.userId,
            },
            select: {
                id: true,
                title: true,
                status: true,
            },
        });

        if (!existingContent) {
            return {
                success: false,
                error: 'Content not found or you don\'t have permission to archive it',
            };
        }

        if (existingContent.status === 'ARCHIVED') {
            return {
                success: false,
                error: 'Content is already archived',
            };
        }

        // Archive content
        await prisma.content.update({
            where: { id },
            data: {
                status: 'ARCHIVED',
            },
        });

        return {
            success: true,
            data: { id },
            message: `"${existingContent.title}" has been archived successfully`,
        };
    } catch (error) {
        console.error('[archiveContent] Error:', error);
        return {
            success: false,
            error: 'Failed to archive content. Please try again.',
        };
    }
};

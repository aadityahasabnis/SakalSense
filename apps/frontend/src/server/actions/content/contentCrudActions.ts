'use server';

// =============================================
// Content CRUD Actions - Create, Update, Delete
// =============================================

import { STAKEHOLDER } from '@/constants/auth.constants';
import { getCurrentUser } from '@/lib/auth';
import { type IApiResponse } from '@/lib/interfaces';
import { prisma } from '@/server/db/prisma';
import { type IContentInput } from '@/types/content.types';

// =============================================
// Create New Content
// =============================================

export const createContent = async (
    input: IContentInput,
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

        // Verify admin exists and is active
        const admin = await prisma.admin.findUnique({
            where: { id: user.userId },
            select: { id: true, isActive: true },
        });

        if (!admin) {
            return {
                success: false,
                error: 'Admin account not found. Please contact support.',
            };
        }

        if (!admin.isActive) {
            return {
                success: false,
                error: 'Your account is inactive. Please contact support.',
            };
        }

        // Check if slug already exists
        const existingSlug = await prisma.content.findUnique({
            where: { slug: input.slug },
            select: { id: true },
        });

        if (existingSlug) {
            return {
                success: false,
                error: `Slug "${input.slug}" is already in use. Please choose a different one.`,
            };
        }

        // Validate category if provided
        let validatedCategoryId: string | undefined;
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

        return {
            success: true,
            data: { id: content.id },
            message: 'Content created successfully',
        };
    } catch (error) {
        console.error('[createContent] Error:', error);
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

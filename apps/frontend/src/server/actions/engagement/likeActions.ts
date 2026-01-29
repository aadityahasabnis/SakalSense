'use server';
// =============================================
// Like Actions - User content liking
// =============================================

import { STAKEHOLDER } from '@/constants/auth.constants';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/server/db/prisma';

// =============================================
// Response Types
// =============================================

interface ILikeResponse {
    success: boolean;
    data?: { isLiked: boolean; likeCount: number };
    error?: string;
}

// =============================================
// Toggle Like
// =============================================

export const toggleLike = async (contentId: string): Promise<ILikeResponse> => {
    try {
        const user = await getCurrentUser(STAKEHOLDER.USER);
        if (!user) {
            return { success: false, error: 'You must be logged in to like content' };
        }

        // Use transaction to ensure atomicity
        const result = await prisma.$transaction(async (tx: typeof prisma) => {
            // Check if like already exists
            const existing = await tx.contentLike.findUnique({
                where: {
                    userId_contentId: {
                        userId: user.userId,
                        contentId,
                    },
                },
            });

            if (existing) {
                // Remove like
                await tx.contentLike.delete({
                    where: {
                        userId_contentId: {
                            userId: user.userId,
                            contentId,
                        },
                    },
                });

                // Decrement like count
                const content = await tx.content.update({
                    where: { id: contentId },
                    data: {
                        likeCount: {
                            decrement: 1,
                        },
                    },
                    select: {
                        likeCount: true,
                    },
                });

                return {
                    isLiked: false,
                    likeCount: content.likeCount,
                };
            } else {
                // Add like
                await tx.contentLike.create({
                    data: {
                        userId: user.userId,
                        contentId,
                    },
                });

                // Increment like count
                const content = await tx.content.update({
                    where: { id: contentId },
                    data: {
                        likeCount: {
                            increment: 1,
                        },
                    },
                    select: {
                        likeCount: true,
                    },
                });

                return {
                    isLiked: true,
                    likeCount: content.likeCount,
                };
            }
        });

        return {
            success: true,
            data: result,
        };
    } catch (error) {
        console.error('toggleLike error:', error);
        return { success: false, error: 'Failed to toggle like' };
    }
};

// =============================================
// Check if Content is Liked
// =============================================

export const checkLikeStatus = async (contentId: string): Promise<ILikeResponse> => {
    try {
        const user = await getCurrentUser(STAKEHOLDER.USER);
        if (!user) {
            // Return current like count but not liked status
            const content = await prisma.content.findUnique({
                where: { id: contentId },
                select: { likeCount: true },
            });

            return {
                success: true,
                data: {
                    isLiked: false,
                    likeCount: content?.likeCount ?? 0,
                },
            };
        }

        const [like, content] = await Promise.all([
            prisma.contentLike.findUnique({
                where: {
                    userId_contentId: {
                        userId: user.userId,
                        contentId,
                    },
                },
            }),
            prisma.content.findUnique({
                where: { id: contentId },
                select: { likeCount: true },
            }),
        ]);

        return {
            success: true,
            data: {
                isLiked: !!like,
                likeCount: content?.likeCount ?? 0,
            },
        };
    } catch (error) {
        console.error('checkLikeStatus error:', error);
        return { success: false, error: 'Failed to check like status' };
    }
};

// =============================================
// Get User's Liked Content
// =============================================

export const getUserLikes = async (filters: {
    page?: number;
    limit?: number;
}): Promise<{
    success: boolean;
    data?: Array<{
        id: string;
        createdAt: Date;
        content: {
            id: string;
            title: string;
            slug: string;
            type: string;
            thumbnailUrl?: string;
            description?: string;
            difficulty: string;
            viewCount: number;
            likeCount: number;
            publishedAt?: Date;
        };
    }>;
    total?: number;
    error?: string;
}> => {
    try {
        const user = await getCurrentUser(STAKEHOLDER.USER);
        if (!user) {
            return { success: false, error: 'Unauthorized' };
        }

        const { page = 1, limit = 20 } = filters;

        const [data, total] = await Promise.all([
            prisma.contentLike.findMany({
                where: {
                    userId: user.userId,
                },
                include: {
                    content: {
                        select: {
                            id: true,
                            title: true,
                            slug: true,
                            type: true,
                            thumbnailUrl: true,
                            description: true,
                            excerpt: true,
                            difficulty: true,
                            viewCount: true,
                            likeCount: true,
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
                orderBy: {
                    createdAt: 'desc',
                },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.contentLike.count({
                where: {
                    userId: user.userId,
                },
            }),
        ]);

        return {
            success: true,
            data: data as ReturnType<typeof getUserLikes> extends Promise<{ data?: infer T }> ? T : never,
            total,
        };
    } catch (error) {
        console.error('getUserLikes error:', error);
        return { success: false, error: 'Failed to fetch liked content' };
    }
};

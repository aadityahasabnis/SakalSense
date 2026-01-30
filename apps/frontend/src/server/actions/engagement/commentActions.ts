'use server';
// =============================================
// Comment Actions - User content commenting
// =============================================

import { STAKEHOLDER } from '@/constants/auth.constants';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/server/db/prisma';
import { type IComment } from '@/types/content.types';

// =============================================
// Response Types
// =============================================

interface ICommentResponse {
    success: boolean;
    data?: { commentId: string };
    error?: string;
}

interface ICommentListResponse {
    success: boolean;
    data?: Array<IComment & {
        user: {
            id: string;
            fullName: string;
            avatarLink?: string;
        };
        replies?: Array<IComment & {
            user: {
                id: string;
                fullName: string;
                avatarLink?: string;
            };
        }>;
    }>;
    total?: number;
    error?: string;
}

// =============================================
// Create Comment
// =============================================

export const createComment = async (data: {
    contentId: string;
    body: string;
    parentId?: string;
}): Promise<ICommentResponse> => {
    try {
        const user = await getCurrentUser(STAKEHOLDER.USER);
        if (!user) {
            return { success: false, error: 'You must be logged in to comment' };
        }

        if (!data.body || data.body.trim().length === 0) {
            return { success: false, error: 'Comment cannot be empty' };
        }

        if (data.body.length > 2000) {
            return { success: false, error: 'Comment is too long (max 2000 characters)' };
        }

        // Use transaction to create comment and update count
        const comment = await prisma.$transaction(async (tx) => {
            // Create comment
            const newComment = await tx.comment.create({
                data: {
                    body: data.body.trim(),
                    userId: user.userId,
                    contentId: data.contentId,
                    parentId: data.parentId,
                },
            });

            // Increment comment count (only for top-level comments)
            if (!data.parentId) {
                await tx.content.update({
                    where: { id: data.contentId },
                    data: {
                        commentCount: {
                            increment: 1,
                        },
                    },
                });
            }

            return newComment;
        });

        return {
            success: true,
            data: { commentId: comment.id },
        };
    } catch (error) {
        console.error('createComment error:', error);
        return { success: false, error: 'Failed to create comment' };
    }
};

// =============================================
// Get Comments for Content
// =============================================

export const getContentComments = async (
    contentId: string,
    filters: {
        page?: number;
        limit?: number;
    } = {}
): Promise<ICommentListResponse> => {
    try {
        const { page = 1, limit = 20 } = filters;
        
        // Get current user to check which comments they've liked
        const currentUser = await getCurrentUser(STAKEHOLDER.USER);
        const userId = currentUser?.userId;

        // Get top-level comments with their replies
        const comments = await prisma.comment.findMany({
            where: {
                contentId,
                parentId: null, // Only top-level comments
            },
            include: {
                user: {
                    select: {
                        id: true,
                        fullName: true,
                        avatarLink: true,
                    },
                },
                replies: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                fullName: true,
                                avatarLink: true,
                            },
                        },
                    },
                    orderBy: {
                        createdAt: 'asc',
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
            skip: (page - 1) * limit,
            take: limit,
        });

        const total = await prisma.comment.count({
            where: {
                contentId,
                parentId: null,
            },
        });

        // If user is logged in, check which comments they've liked
        let likedCommentIds: Set<string> = new Set();
        if (userId) {
            // Get all comment IDs (including replies)
            const allCommentIds: string[] = [];
            for (const comment of comments) {
                allCommentIds.push(comment.id);
                if (comment.replies) {
                    for (const reply of comment.replies) {
                        allCommentIds.push(reply.id);
                    }
                }
            }

            // Fetch which comments the user has liked
            const userLikes = await prisma.commentLike.findMany({
                where: {
                    userId,
                    commentId: { in: allCommentIds },
                },
                select: { commentId: true },
            });

            likedCommentIds = new Set(userLikes.map((like) => like.commentId));
        }

        // Transform data to include isLiked field
        const transformedData = comments.map((comment) => ({
            ...comment,
            isLiked: likedCommentIds.has(comment.id),
            replies: comment.replies?.map((reply) => ({
                ...reply,
                isLiked: likedCommentIds.has(reply.id),
            })),
        }));

        return {
            success: true,
            data: transformedData as unknown as ICommentListResponse['data'],
            total,
        };
    } catch (error) {
        console.error('getContentComments error:', error);
        return { success: false, error: 'Failed to fetch comments' };
    }
};

// =============================================
// Update Comment
// =============================================

export const updateComment = async (commentId: string, body: string): Promise<ICommentResponse> => {
    try {
        const user = await getCurrentUser(STAKEHOLDER.USER);
        if (!user) {
            return { success: false, error: 'Unauthorized' };
        }

        if (!body || body.trim().length === 0) {
            return { success: false, error: 'Comment cannot be empty' };
        }

        if (body.length > 2000) {
            return { success: false, error: 'Comment is too long (max 2000 characters)' };
        }

        // Verify ownership
        const existing = await prisma.comment.findUnique({
            where: { id: commentId },
        });

        if (!existing) {
            return { success: false, error: 'Comment not found' };
        }

        if (existing.userId !== user.userId) {
            return { success: false, error: 'You can only edit your own comments' };
        }

        // Update comment
        await prisma.comment.update({
            where: { id: commentId },
            data: {
                body: body.trim(),
                isEdited: true,
            },
        });

        return {
            success: true,
            data: { commentId },
        };
    } catch (error) {
        console.error('updateComment error:', error);
        return { success: false, error: 'Failed to update comment' };
    }
};

// =============================================
// Delete Comment
// =============================================

export const deleteComment = async (commentId: string): Promise<ICommentResponse> => {
    try {
        const user = await getCurrentUser(STAKEHOLDER.USER);
        if (!user) {
            return { success: false, error: 'Unauthorized' };
        }

        // Verify ownership
        const existing = await prisma.comment.findUnique({
            where: { id: commentId },
            select: {
                userId: true,
                contentId: true,
                parentId: true,
            },
        });

        if (!existing) {
            return { success: false, error: 'Comment not found' };
        }

        if (existing.userId !== user.userId) {
            return { success: false, error: 'You can only delete your own comments' };
        }

        // Use transaction to delete comment and update count
        await prisma.$transaction(async (tx) => {
            // Delete comment (cascade will delete replies)
            await tx.comment.delete({
                where: { id: commentId },
            });

            // Decrement comment count (only for top-level comments)
            if (!existing.parentId) {
                await tx.content.update({
                    where: { id: existing.contentId },
                    data: {
                        commentCount: {
                            decrement: 1,
                        },
                    },
                });
            }
        });

        return {
            success: true,
            data: { commentId },
        };
    } catch (error) {
        console.error('deleteComment error:', error);
        return { success: false, error: 'Failed to delete comment' };
    }
};

// =============================================
// Toggle Comment Like
// =============================================

export const toggleCommentLike = async (commentId: string): Promise<{ success: boolean; isLiked: boolean; likeCount: number; error?: string }> => {
    try {
        const user = await getCurrentUser(STAKEHOLDER.USER);
        if (!user) {
            return { success: false, isLiked: false, likeCount: 0, error: 'You must be logged in to like comments' };
        }

        const result = await prisma.$transaction(async (tx) => {
            // Check if like already exists
            const existing = await tx.commentLike.findUnique({
                where: {
                    userId_commentId: {
                        userId: user.userId,
                        commentId,
                    },
                },
            });

            if (existing) {
                // Remove like
                await tx.commentLike.delete({
                    where: {
                        userId_commentId: {
                            userId: user.userId,
                            commentId,
                        },
                    },
                });

                // Decrement like count
                const comment = await tx.comment.update({
                    where: { id: commentId },
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
                    likeCount: comment.likeCount,
                };
            } else {
                // Add like
                await tx.commentLike.create({
                    data: {
                        userId: user.userId,
                        commentId,
                    },
                });

                // Increment like count
                const comment = await tx.comment.update({
                    where: { id: commentId },
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
                    likeCount: comment.likeCount,
                };
            }
        });

        return {
            success: true,
            ...result,
        };
    } catch (error) {
        console.error('toggleCommentLike error:', error);
        return { success: false, isLiked: false, likeCount: 0, error: 'Failed to toggle comment like' };
    }
};

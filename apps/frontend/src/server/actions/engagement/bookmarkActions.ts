'use server';
// =============================================
// Bookmark Actions - User content bookmarking
// =============================================

import { STAKEHOLDER } from '@/constants/auth.constants';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/server/db/prisma';
import { type IBookmark } from '@/types/content.types';

// =============================================
// Response Types
// =============================================

interface IBookmarkResponse {
    success: boolean;
    data?: { bookmarkId?: string; isBookmarked: boolean };
    error?: string;
}

interface IBookmarkListResponse {
    success: boolean;
    data?: Array<IBookmark & {
        content: {
            id: string;
            title: string;
            slug: string;
            type: string;
            thumbnailUrl?: string;
            description?: string;
        };
    }>;
    total?: number;
    error?: string;
}

// =============================================
// Toggle Bookmark
// =============================================

export const toggleBookmark = async (contentId: string): Promise<IBookmarkResponse> => {
    try {
        const user = await getCurrentUser(STAKEHOLDER.USER);
        if (!user) {
            return { success: false, error: 'You must be logged in to bookmark content' };
        }

        // Check if bookmark already exists
        const existing = await prisma.bookmark.findUnique({
            where: {
                userId_contentId: {
                    userId: user.userId,
                    contentId,
                },
            },
        });

        if (existing) {
            // Remove bookmark
            await prisma.bookmark.delete({
                where: {
                    userId_contentId: {
                        userId: user.userId,
                        contentId,
                    },
                },
            });

            return {
                success: true,
                data: { isBookmarked: false },
            };
        } else {
            // Add bookmark
            const bookmark = await prisma.bookmark.create({
                data: {
                    userId: user.userId,
                    contentId,
                },
            });

            return {
                success: true,
                data: {
                    bookmarkId: bookmark.id,
                    isBookmarked: true,
                },
            };
        }
    } catch (error) {
        console.error('toggleBookmark error:', error);
        return { success: false, error: 'Failed to toggle bookmark' };
    }
};

// =============================================
// Check if Content is Bookmarked
// =============================================

export const checkBookmarkStatus = async (contentId: string): Promise<IBookmarkResponse> => {
    try {
        const user = await getCurrentUser(STAKEHOLDER.USER);
        if (!user) {
            return { success: true, data: { isBookmarked: false } };
        }

        const bookmark = await prisma.bookmark.findUnique({
            where: {
                userId_contentId: {
                    userId: user.userId,
                    contentId,
                },
            },
        });

        return {
            success: true,
            data: {
                bookmarkId: bookmark?.id,
                isBookmarked: !!bookmark,
            },
        };
    } catch (error) {
        console.error('checkBookmarkStatus error:', error);
        return { success: false, error: 'Failed to check bookmark status' };
    }
};

// =============================================
// Get User's Bookmarks
// =============================================

export const getUserBookmarks = async (filters: {
    page?: number;
    limit?: number;
}): Promise<IBookmarkListResponse> => {
    try {
        const user = await getCurrentUser(STAKEHOLDER.USER);
        if (!user) {
            return { success: false, error: 'Unauthorized' };
        }

        const { page = 1, limit = 20 } = filters;

        const [data, total] = await Promise.all([
            prisma.bookmark.findMany({
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
            prisma.bookmark.count({
                where: {
                    userId: user.userId,
                },
            }),
        ]);

        return {
            success: true,
            data: data as IBookmarkListResponse['data'],
            total,
        };
    } catch (error) {
        console.error('getUserBookmarks error:', error);
        return { success: false, error: 'Failed to fetch bookmarks' };
    }
};

// =============================================
// Remove Multiple Bookmarks
// =============================================

export const removeBookmarks = async (bookmarkIds: Array<string>): Promise<IBookmarkResponse> => {
    try {
        const user = await getCurrentUser(STAKEHOLDER.USER);
        if (!user) {
            return { success: false, error: 'Unauthorized' };
        }

        await prisma.bookmark.deleteMany({
            where: {
                id: { in: bookmarkIds },
                userId: user.userId, // Security: only delete user's own bookmarks
            },
        });

        return { success: true, data: { isBookmarked: false } };
    } catch (error) {
        console.error('removeBookmarks error:', error);
        return { success: false, error: 'Failed to remove bookmarks' };
    }
};

'use server';

// =============================================
// User Profile Actions - Profile CRUD and Settings
// =============================================

import { STAKEHOLDER } from '@/constants/auth.constants';
import { getCurrentUser } from '@/lib/auth';
import { invalidateUserCache } from '@/lib/auth-cache';
import { type IApiResponse } from '@/lib/interfaces';
import { prisma } from '@/server/db/prisma';
import { hashPassword, verifyPassword } from '@/server/utils/password';

// =============================================
// Type Definitions
// =============================================

export interface IUserProfile {
    id: string;
    email: string;
    fullName: string;
    mobile: string | null;
    avatarLink: string | null;
    isVerified: boolean;
    createdAt: Date;
    stats: {
        bookmarksCount: number;
        likesCount: number;
        commentsCount: number;
        coursesEnrolled: number;
        contentCompleted: number;
        currentStreak: number;
        longestStreak: number;
    };
}

export interface IUpdateProfileInput {
    fullName?: string;
    mobile?: string;
    avatarLink?: string;
}

// =============================================
// Get User Profile
// =============================================

export const getUserProfile = async (): Promise<IApiResponse<IUserProfile | null>> => {
    try {
        const currentUser = await getCurrentUser(STAKEHOLDER.USER);
        if (!currentUser) {
            return {
                success: false,
                error: 'Unauthorized - Please log in',
                data: null,
            };
        }

        // Fetch user with stats in parallel
        const [user, stats] = await Promise.all([
            prisma.user.findUnique({
                where: { id: currentUser.userId },
                select: {
                    id: true,
                    email: true,
                    fullName: true,
                    mobile: true,
                    avatarLink: true,
                    isVerified: true,
                    createdAt: true,
                },
            }),
            Promise.all([
                prisma.bookmark.count({ where: { userId: currentUser.userId } }),
                prisma.contentLike.count({ where: { userId: currentUser.userId } }),
                prisma.comment.count({ where: { userId: currentUser.userId } }),
                prisma.courseEnrollment.count({ where: { userId: currentUser.userId } }),
                prisma.contentProgress.count({
                    where: {
                        userId: currentUser.userId,
                        completedAt: { not: null },
                    },
                }),
                prisma.userStreak.findUnique({
                    where: { userId: currentUser.userId },
                    select: { currentStreak: true, longestStreak: true },
                }),
            ]),
        ]);

        if (!user) {
            return {
                success: false,
                error: 'User not found',
                data: null,
            };
        }

        const [bookmarksCount, likesCount, commentsCount, coursesEnrolled, contentCompleted, streak] = stats;

        return {
            success: true,
            data: {
                ...user,
                stats: {
                    bookmarksCount,
                    likesCount,
                    commentsCount,
                    coursesEnrolled,
                    contentCompleted,
                    currentStreak: streak?.currentStreak ?? 0,
                    longestStreak: streak?.longestStreak ?? 0,
                },
            },
        };
    } catch (error) {
        console.error('[getUserProfile] Error:', error);
        return {
            success: false,
            error: 'Failed to fetch profile',
            data: null,
        };
    }
};

// =============================================
// Update User Profile
// =============================================

export const updateUserProfile = async (
    input: IUpdateProfileInput,
): Promise<IApiResponse<{ id: string }>> => {
    try {
        const currentUser = await getCurrentUser(STAKEHOLDER.USER);
        if (!currentUser) {
            return {
                success: false,
                error: 'Unauthorized - Please log in',
            };
        }

        // Validate input
        if (input.fullName !== undefined && input.fullName.trim().length < 2) {
            return {
                success: false,
                error: 'Name must be at least 2 characters',
            };
        }

        if (input.mobile !== undefined && input.mobile.trim().length > 0) {
            // Basic phone validation
            const phoneRegex = /^[+]?[0-9]{10,15}$/;
            if (!phoneRegex.test(input.mobile.replace(/\s/g, ''))) {
                return {
                    success: false,
                    error: 'Invalid phone number format',
                };
            }
        }

        // Update user
        await prisma.user.update({
            where: { id: currentUser.userId },
            data: {
                ...(input.fullName && { fullName: input.fullName.trim() }),
                ...(input.mobile !== undefined && { mobile: input.mobile.trim() || null }),
                ...(input.avatarLink !== undefined && { avatarLink: input.avatarLink.trim() || null }),
            },
        });

        // Invalidate cached user data
        void invalidateUserCache('USER', currentUser.userId);

        return {
            success: true,
            data: { id: currentUser.userId },
            message: 'Profile updated successfully',
        };
    } catch (error) {
        console.error('[updateUserProfile] Error:', error);
        return {
            success: false,
            error: 'Failed to update profile',
        };
    }
};

// =============================================
// Get User Reading History
// =============================================

export const getUserReadingHistory = async (
    filters: { page?: number; limit?: number } = {},
): Promise<IApiResponse<{
    history: Array<{
        id: string;
        contentId: string;
        progress: number;
        isCompleted: boolean;
        lastReadAt: Date;
        content: {
            id: string;
            title: string;
            slug: string;
            type: string;
            thumbnailUrl: string | null;
            difficulty: string;
        };
    }>;
    total: number;
}>> => {
    try {
        const currentUser = await getCurrentUser(STAKEHOLDER.USER);
        if (!currentUser) {
            return {
                success: false,
                error: 'Unauthorized',
            };
        }

        const { page = 1, limit = 20 } = filters;

        const [history, total] = await Promise.all([
            prisma.contentProgress.findMany({
                where: { userId: currentUser.userId },
                include: {
                    content: {
                        select: {
                            id: true,
                            title: true,
                            slug: true,
                            type: true,
                            thumbnailUrl: true,
                            difficulty: true,
                        },
                    },
                },
                orderBy: { lastViewedAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.contentProgress.count({ where: { userId: currentUser.userId } }),
        ]);

        return {
            success: true,
            data: {
                history: history.map((h) => {
                    const item = h as typeof h & { content: {
                        id: string;
                        title: string;
                        slug: string;
                        type: string;
                        thumbnailUrl: string | null;
                        difficulty: string;
                    }};
                    return {
                        id: item.id,
                        contentId: item.contentId,
                        progress: item.progress,
                        isCompleted: item.completedAt !== null,
                        lastReadAt: item.lastViewedAt,
                        content: item.content,
                    };
                }),
                total,
            },
        };
    } catch (error) {
        console.error('[getUserReadingHistory] Error:', error);
        return {
            success: false,
            error: 'Failed to fetch reading history',
        };
    }
};

// =============================================
// Get User Stats Summary
// =============================================

export const getUserStatsSummary = async (): Promise<IApiResponse<{
    totalTimeSpent: number; // in minutes
    contentRead: number;
    coursesCompleted: number;
    currentStreak: number;
    longestStreak: number;
    thisWeekActivity: Array<{ date: string; count: number }>;
}>> => {
    try {
        const currentUser = await getCurrentUser(STAKEHOLDER.USER);
        if (!currentUser) {
            return {
                success: false,
                error: 'Unauthorized',
            };
        }

        // Get date range for this week
        const today = new Date();
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - 6);
        weekStart.setHours(0, 0, 0, 0);

        const [completedContent, completedCourses, streak, timeSpentSum] = await Promise.all([
            prisma.contentProgress.count({
                where: {
                    userId: currentUser.userId,
                    completedAt: { not: null },
                },
            }),
            prisma.courseEnrollment.count({
                where: {
                    userId: currentUser.userId,
                    completedAt: { not: null },
                },
            }),
            prisma.userStreak.findUnique({
                where: { userId: currentUser.userId },
                select: { currentStreak: true, longestStreak: true },
            }),
            prisma.contentProgress.aggregate({
                where: { userId: currentUser.userId },
                _sum: { timeSpent: true },
            }),
        ]);

        // Generate weekly activity (simplified - count views per day)
        const thisWeekActivity: Array<{ date: string; count: number }> = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(weekStart);
            date.setDate(weekStart.getDate() + i);
            const dateStr = date.toISOString().split('T')[0] ?? '';

            const nextDate = new Date(date);
            nextDate.setDate(date.getDate() + 1);

            const count = await prisma.contentView.count({
                where: {
                    userId: currentUser.userId,
                    createdAt: {
                        gte: date,
                        lt: nextDate,
                    },
                },
            });

            thisWeekActivity.push({ date: dateStr, count });
        }

        return {
            success: true,
            data: {
                totalTimeSpent: Math.round((timeSpentSum._sum.timeSpent ?? 0) / 60),
                contentRead: completedContent,
                coursesCompleted: completedCourses,
                currentStreak: streak?.currentStreak ?? 0,
                longestStreak: streak?.longestStreak ?? 0,
                thisWeekActivity,
            },
        };
    } catch (error) {
        console.error('[getUserStatsSummary] Error:', error);
        return {
            success: false,
            error: 'Failed to fetch stats',
        };
    }
};

// =============================================
// Delete User Account
// =============================================

export const deleteUserAccount = async (): Promise<IApiResponse<{ success: boolean }>> => {
    try {
        const currentUser = await getCurrentUser(STAKEHOLDER.USER);
        if (!currentUser) {
            return {
                success: false,
                error: 'Unauthorized',
            };
        }

        // Delete user (cascades will handle related records)
        await prisma.user.delete({
            where: { id: currentUser.userId },
        });

        // Invalidate cache
        void invalidateUserCache('USER', currentUser.userId);

        return {
            success: true,
            data: { success: true },
            message: 'Account deleted successfully',
        };
    } catch (error) {
        console.error('[deleteUserAccount] Error:', error);
        return {
            success: false,
            error: 'Failed to delete account',
        };
    }
};

// =============================================
// Get Yearly Activity (for Activity Calendar)
// =============================================

export const getYearlyActivity = async (
    year?: number,
): Promise<IApiResponse<Array<{ date: string; count: number }>>> => {
    try {
        const currentUser = await getCurrentUser(STAKEHOLDER.USER);
        if (!currentUser) {
            return {
                success: false,
                error: 'Unauthorized',
            };
        }

        const targetYear = year ?? new Date().getFullYear();
        const startDate = new Date(targetYear, 0, 1);
        const endDate = new Date(targetYear, 11, 31, 23, 59, 59);

        // Get all content views for the year
        const views = await prisma.contentView.findMany({
            where: {
                userId: currentUser.userId,
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            select: {
                createdAt: true,
            },
        });

        // Group by date
        const activityMap = new Map<string, number>();
        views.forEach((view) => {
            const dateStr = view.createdAt.toISOString().split('T')[0] ?? '';
            activityMap.set(dateStr, (activityMap.get(dateStr) ?? 0) + 1);
        });

        // Convert to array
        const activity = Array.from(activityMap.entries()).map(([date, count]) => ({
            date,
            count,
        }));

        return {
            success: true,
            data: activity,
        };
    } catch (error) {
        console.error('[getYearlyActivity] Error:', error);
        return {
            success: false,
            error: 'Failed to fetch activity data',
        };
    }
};

// =============================================
// Change Password
// =============================================

export const changePassword = async (input: {
    currentPassword: string;
    newPassword: string;
}): Promise<IApiResponse<{ success: boolean }>> => {
    try {
        const currentUser = await getCurrentUser(STAKEHOLDER.USER);
        if (!currentUser) {
            return {
                success: false,
                error: 'Unauthorized',
            };
        }

        // Validate new password
        if (input.newPassword.length < 8) {
            return {
                success: false,
                error: 'Password must be at least 8 characters',
            };
        }

        // Get user with password
        const user = await prisma.user.findUnique({
            where: { id: currentUser.userId },
            select: { password: true },
        });

        if (!user) {
            return {
                success: false,
                error: 'User not found',
            };
        }

        // Verify current password
        const isValid = await verifyPassword(input.currentPassword, user.password);

        if (!isValid) {
            return {
                success: false,
                error: 'Current password is incorrect',
            };
        }

        // Hash new password
        const hashedPassword = await hashPassword(input.newPassword);

        // Update password
        await prisma.user.update({
            where: { id: currentUser.userId },
            data: { password: hashedPassword },
        });

        return {
            success: true,
            data: { success: true },
            message: 'Password changed successfully',
        };
    } catch (error) {
        console.error('[changePassword] Error:', error);
        return {
            success: false,
            error: 'Failed to change password',
        };
    }
};

'use server';
// =============================================
// Activity Feed Actions - Track and display user activities
// =============================================

import { STAKEHOLDER } from '@/constants/auth.constants';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/server/db/prisma';

// =============================================
// Activity Types
// =============================================

export type ActivityType =
    | 'CONTENT_READ'
    | 'CONTENT_COMPLETED'
    | 'COURSE_ENROLLED'
    | 'COURSE_COMPLETED'
    | 'LESSON_COMPLETED'
    | 'PROBLEM_SOLVED'
    | 'ACHIEVEMENT_UNLOCKED'
    | 'BADGE_EARNED'
    | 'FOLLOWED_USER'
    | 'LEVEL_UP';

// =============================================
// Response Types
// =============================================

interface IActivityItem {
    id: string;
    type: string;
    targetId: string | null;
    metadata: Record<string, unknown> | null;
    createdAt: Date;
    user: {
        id: string;
        fullName: string;
        username: string | null;
        avatarLink: string | null;
    };
}

interface IActivityFeedResponse {
    success: boolean;
    data?: Array<IActivityItem>;
    hasMore?: boolean;
    error?: string;
}

interface ICreateActivityResponse {
    success: boolean;
    data?: { id: string };
    error?: string;
}

// =============================================
// Create Activity (Internal use)
// =============================================

export const createActivity = async (
    type: ActivityType,
    targetId?: string,
    metadata?: Record<string, unknown>,
    isPublic: boolean = true
): Promise<ICreateActivityResponse> => {
    try {
        const user = await getCurrentUser(STAKEHOLDER.USER);
        if (!user) return { success: false, error: 'User not authenticated' };

        const activity = await prisma.activityFeed.create({
            data: {
                userId: user.userId,
                type,
                targetId: targetId ?? null,
                metadata: metadata ?? null,
                isPublic,
            },
        });

        return { success: true, data: { id: activity.id } };
    } catch (error) {
        console.error('createActivity error:', error);
        return { success: false, error: 'Failed to create activity' };
    }
};

// =============================================
// Get Activity Feed (From users you follow)
// =============================================

export const getActivityFeed = async (
    page: number = 1,
    limit: number = 20
): Promise<IActivityFeedResponse> => {
    try {
        const user = await getCurrentUser(STAKEHOLDER.USER);
        if (!user) return { success: false, error: 'Please log in to view your feed' };

        // Get users the current user follows
        const following = await prisma.userFollow.findMany({
            where: { followerId: user.userId },
            select: { followingId: true },
        });

        const followingIds = following.map((f) => f.followingId);

        // Include own activities and activities from followed users
        const activities = await prisma.activityFeed.findMany({
            where: {
                OR: [
                    { userId: { in: followingIds }, isPublic: true },
                    { userId: user.userId }, // Always show own activities
                ],
            },
            select: {
                id: true,
                type: true,
                targetId: true,
                metadata: true,
                createdAt: true,
                user: {
                    select: {
                        id: true,
                        fullName: true,
                        username: true,
                        avatarLink: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit + 1, // Fetch one extra to check if there's more
        });

        const hasMore = activities.length > limit;
        const data = activities.slice(0, limit);

        return {
            success: true,
            data: data as Array<IActivityItem>,
            hasMore,
        };
    } catch (error) {
        console.error('getActivityFeed error:', error);
        return { success: false, error: 'Failed to fetch activity feed' };
    }
};

// =============================================
// Get User's Public Activity Feed
// =============================================

export const getUserActivityFeed = async (
    userId: string,
    page: number = 1,
    limit: number = 20
): Promise<IActivityFeedResponse> => {
    try {
        const activities = await prisma.activityFeed.findMany({
            where: {
                userId,
                isPublic: true,
            },
            select: {
                id: true,
                type: true,
                targetId: true,
                metadata: true,
                createdAt: true,
                user: {
                    select: {
                        id: true,
                        fullName: true,
                        username: true,
                        avatarLink: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit + 1,
        });

        const hasMore = activities.length > limit;
        const data = activities.slice(0, limit);

        return {
            success: true,
            data: data as Array<IActivityItem>,
            hasMore,
        };
    } catch (error) {
        console.error('getUserActivityFeed error:', error);
        return { success: false, error: 'Failed to fetch user activity' };
    }
};

// =============================================
// Get Recent Activities (For Dashboard)
// =============================================

export const getRecentActivities = async (
    limit: number = 10
): Promise<IActivityFeedResponse> => {
    try {
        const user = await getCurrentUser(STAKEHOLDER.USER);
        if (!user) return { success: true, data: [] };

        const activities = await prisma.activityFeed.findMany({
            where: { userId: user.userId },
            select: {
                id: true,
                type: true,
                targetId: true,
                metadata: true,
                createdAt: true,
                user: {
                    select: {
                        id: true,
                        fullName: true,
                        username: true,
                        avatarLink: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });

        return { success: true, data: activities as Array<IActivityItem> };
    } catch (error) {
        console.error('getRecentActivities error:', error);
        return { success: false, error: 'Failed to fetch recent activities' };
    }
};

// =============================================
// Get Global Activity Feed (Trending/Public)
// =============================================

export const getGlobalActivityFeed = async (
    page: number = 1,
    limit: number = 20
): Promise<IActivityFeedResponse> => {
    try {
        const activities = await prisma.activityFeed.findMany({
            where: { isPublic: true },
            select: {
                id: true,
                type: true,
                targetId: true,
                metadata: true,
                createdAt: true,
                user: {
                    select: {
                        id: true,
                        fullName: true,
                        username: true,
                        avatarLink: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit + 1,
        });

        const hasMore = activities.length > limit;
        const data = activities.slice(0, limit);

        return {
            success: true,
            data: data as Array<IActivityItem>,
            hasMore,
        };
    } catch (error) {
        console.error('getGlobalActivityFeed error:', error);
        return { success: false, error: 'Failed to fetch global activity' };
    }
};

// =============================================
// Helper: Format Activity for Display (Non-exported helper)
// NOTE: This is used client-side via a separate utility file
// =============================================

// Activity description config is moved to a client utility
// See: src/lib/utils/activityUtils.ts

// =============================================
// Delete Activity (For user's own activities)
// =============================================

export const deleteActivity = async (activityId: string): Promise<{ success: boolean; error?: string }> => {
    try {
        const user = await getCurrentUser(STAKEHOLDER.USER);
        if (!user) return { success: false, error: 'Not authenticated' };

        // Check if activity belongs to user
        const activity = await prisma.activityFeed.findUnique({
            where: { id: activityId },
            select: { userId: true },
        });

        if (!activity) return { success: false, error: 'Activity not found' };
        if (activity.userId !== user.userId) {
            return { success: false, error: 'Unauthorized' };
        }

        await prisma.activityFeed.delete({
            where: { id: activityId },
        });

        return { success: true };
    } catch (error) {
        console.error('deleteActivity error:', error);
        return { success: false, error: 'Failed to delete activity' };
    }
};

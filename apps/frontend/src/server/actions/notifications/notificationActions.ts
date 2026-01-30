'use server';
// =============================================
// Notification Actions - Manage user notifications
// =============================================

import { STAKEHOLDER } from '@/constants/auth.constants';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/server/db/prisma';

// =============================================
// Types
// =============================================

export type NotificationType =
    | 'ACHIEVEMENT'
    | 'BADGE'
    | 'FOLLOW'
    | 'COMMENT_REPLY'
    | 'MENTION'
    | 'STREAK'
    | 'GOAL_REMINDER'
    | 'LEVEL_UP'
    | 'XP_EARNED';

interface INotification {
    id: string;
    type: string;
    title: string;
    message: string;
    link: string | null;
    metadata: Record<string, unknown> | null;
    isRead: boolean;
    createdAt: Date;
}

interface INotificationResponse {
    success: boolean;
    data?: INotification[];
    unreadCount?: number;
    total?: number;
    error?: string;
}

interface ICreateNotificationInput {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    link?: string;
    metadata?: Record<string, unknown>;
}

// =============================================
// Create Notification (Internal use)
// =============================================

export const createNotification = async (
    input: ICreateNotificationInput
): Promise<{ success: boolean; id?: string; error?: string }> => {
    try {
        const notification = await prisma.notification.create({
            data: {
                userId: input.userId,
                type: input.type,
                title: input.title,
                message: input.message,
                link: input.link ?? null,
                metadata: input.metadata ?? null,
            },
        });

        return { success: true, id: notification.id };
    } catch (error) {
        console.error('createNotification error:', error);
        return { success: false, error: 'Failed to create notification' };
    }
};

// =============================================
// Get User Notifications
// =============================================

export const getNotifications = async (
    page: number = 1,
    limit: number = 20,
    unreadOnly: boolean = false
): Promise<INotificationResponse> => {
    try {
        const user = await getCurrentUser(STAKEHOLDER.USER);
        if (!user) return { success: false, error: 'Not authenticated' };

        const where = {
            userId: user.userId,
            ...(unreadOnly && { isRead: false }),
        };

        const [notifications, total, unreadCount] = await Promise.all([
            prisma.notification.findMany({
                where,
                select: {
                    id: true,
                    type: true,
                    title: true,
                    message: true,
                    link: true,
                    metadata: true,
                    isRead: true,
                    createdAt: true,
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.notification.count({ where }),
            prisma.notification.count({
                where: { userId: user.userId, isRead: false },
            }),
        ]);

        return {
            success: true,
            data: notifications as INotification[],
            total,
            unreadCount,
        };
    } catch (error) {
        console.error('getNotifications error:', error);
        return { success: false, error: 'Failed to fetch notifications' };
    }
};

// =============================================
// Get Unread Count
// =============================================

export const getUnreadNotificationCount = async (): Promise<{
    success: boolean;
    count?: number;
    error?: string;
}> => {
    try {
        const user = await getCurrentUser(STAKEHOLDER.USER);
        if (!user) return { success: true, count: 0 };

        const count = await prisma.notification.count({
            where: { userId: user.userId, isRead: false },
        });

        return { success: true, count };
    } catch (error) {
        console.error('getUnreadNotificationCount error:', error);
        return { success: false, error: 'Failed to get count' };
    }
};

// =============================================
// Mark Notification as Read
// =============================================

export const markNotificationAsRead = async (
    notificationId: string
): Promise<{ success: boolean; error?: string }> => {
    try {
        const user = await getCurrentUser(STAKEHOLDER.USER);
        if (!user) return { success: false, error: 'Not authenticated' };

        await prisma.notification.updateMany({
            where: {
                id: notificationId,
                userId: user.userId,
            },
            data: { isRead: true },
        });

        return { success: true };
    } catch (error) {
        console.error('markNotificationAsRead error:', error);
        return { success: false, error: 'Failed to mark as read' };
    }
};

// =============================================
// Mark All Notifications as Read
// =============================================

export const markAllNotificationsAsRead = async (): Promise<{
    success: boolean;
    count?: number;
    error?: string;
}> => {
    try {
        const user = await getCurrentUser(STAKEHOLDER.USER);
        if (!user) return { success: false, error: 'Not authenticated' };

        const result = await prisma.notification.updateMany({
            where: {
                userId: user.userId,
                isRead: false,
            },
            data: { isRead: true },
        });

        return { success: true, count: result.count };
    } catch (error) {
        console.error('markAllNotificationsAsRead error:', error);
        return { success: false, error: 'Failed to mark all as read' };
    }
};

// =============================================
// Delete Notification
// =============================================

export const deleteNotification = async (
    notificationId: string
): Promise<{ success: boolean; error?: string }> => {
    try {
        const user = await getCurrentUser(STAKEHOLDER.USER);
        if (!user) return { success: false, error: 'Not authenticated' };

        await prisma.notification.deleteMany({
            where: {
                id: notificationId,
                userId: user.userId,
            },
        });

        return { success: true };
    } catch (error) {
        console.error('deleteNotification error:', error);
        return { success: false, error: 'Failed to delete notification' };
    }
};

// =============================================
// Delete All Read Notifications
// =============================================

export const deleteAllReadNotifications = async (): Promise<{
    success: boolean;
    count?: number;
    error?: string;
}> => {
    try {
        const user = await getCurrentUser(STAKEHOLDER.USER);
        if (!user) return { success: false, error: 'Not authenticated' };

        const result = await prisma.notification.deleteMany({
            where: {
                userId: user.userId,
                isRead: true,
            },
        });

        return { success: true, count: result.count };
    } catch (error) {
        console.error('deleteAllReadNotifications error:', error);
        return { success: false, error: 'Failed to delete notifications' };
    }
};

// =============================================
// Helper: Create Follow Notification
// =============================================

export const createFollowNotification = async (
    followedUserId: string,
    followerName: string,
    followerUsername: string | null
): Promise<void> => {
    try {
        await createNotification({
            userId: followedUserId,
            type: 'FOLLOW',
            title: 'New Follower',
            message: `${followerName} started following you`,
            link: `/user/${followerUsername ?? followedUserId}`,
            metadata: { followerName, followerUsername },
        });
    } catch (error) {
        console.error('createFollowNotification error:', error);
    }
};

// =============================================
// Helper: Create Achievement Notification
// =============================================

export const createAchievementNotification = async (
    userId: string,
    achievementName: string,
    achievementIcon: string | null,
    xpReward: number
): Promise<void> => {
    try {
        await createNotification({
            userId,
            type: 'ACHIEVEMENT',
            title: 'Achievement Unlocked!',
            message: `You unlocked "${achievementName}" and earned ${xpReward} XP!`,
            link: '/profile?tab=achievements',
            metadata: { achievementName, achievementIcon, xpReward },
        });
    } catch (error) {
        console.error('createAchievementNotification error:', error);
    }
};

// =============================================
// Helper: Create Level Up Notification
// =============================================

export const createLevelUpNotification = async (
    userId: string,
    newLevel: number,
    totalXP: number
): Promise<void> => {
    try {
        await createNotification({
            userId,
            type: 'LEVEL_UP',
            title: 'Level Up!',
            message: `Congratulations! You've reached Level ${newLevel}!`,
            link: '/leaderboard',
            metadata: { newLevel, totalXP },
        });
    } catch (error) {
        console.error('createLevelUpNotification error:', error);
    }
};

// =============================================
// Helper: Create Streak Notification
// =============================================

export const createStreakNotification = async (
    userId: string,
    streakDays: number
): Promise<void> => {
    try {
        const milestones = [7, 14, 30, 60, 100, 365];
        if (!milestones.includes(streakDays)) return;

        await createNotification({
            userId,
            type: 'STREAK',
            title: 'Streak Milestone!',
            message: `Amazing! You've maintained a ${streakDays}-day learning streak!`,
            link: '/profile',
            metadata: { streakDays },
        });
    } catch (error) {
        console.error('createStreakNotification error:', error);
    }
};

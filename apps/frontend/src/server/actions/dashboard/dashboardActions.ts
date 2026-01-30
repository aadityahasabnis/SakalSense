'use server';

// =============================================
// Dashboard Actions - Aggregated User Dashboard Data
// =============================================

import { STAKEHOLDER } from '@/constants/auth.constants';
import { getCurrentUser } from '@/lib/auth';
import { type IApiResponse } from '@/lib/interfaces';
import { prisma } from '@/server/db/prisma';

// =============================================
// Types
// =============================================

export interface IUserStats {
    totalXP: number;
    level: number;
    xpToNextLevel: number;
    progressToNextLevel: number;
    currentStreak: number;
    longestStreak: number;
    rank: number | null;
}

export interface IContinueLearningItem {
    id: string;
    type: 'course' | 'content';
    title: string;
    slug: string;
    thumbnailUrl: string | null;
    progress: number;
    lastAccessedAt: Date;
    nextAction?: string; // e.g., "Continue Lesson 3"
}

export interface IRecentActivity {
    id: string;
    type: 'XP_EARNED' | 'LESSON_COMPLETED' | 'COURSE_ENROLLED' | 'PROBLEM_SOLVED' | 'CONTENT_READ' | 'ACHIEVEMENT_UNLOCKED';
    description: string;
    xp?: number;
    createdAt: Date;
    targetId?: string;
    metadata?: Record<string, unknown>;
}

export interface IDailyGoalProgress {
    xpEarned: number;
    xpGoal: number;
    xpPercentage: number;
    contentCompleted: number;
    contentGoal: number;
    contentPercentage: number;
    lessonsCompleted: number;
    problemsSolved: number;
    goalMet: boolean;
}

export interface IRecommendation {
    id: string;
    type: 'course' | 'content' | 'practice';
    title: string;
    slug: string;
    thumbnailUrl: string | null;
    difficulty: string;
    reason: string; // "Popular in your interests", "Trending", etc.
}

export interface IDashboardData {
    user: {
        id: string;
        fullName: string;
        avatarLink: string | null;
    };
    stats: IUserStats;
    dailyProgress: IDailyGoalProgress;
    continueLearning: IContinueLearningItem[];
    recentActivity: IRecentActivity[];
    recommendations: IRecommendation[];
    activityCalendar: Array<{ date: string; count: number; level: 0 | 1 | 2 | 3 | 4 }>;
}

// =============================================
// Helper Functions
// =============================================

const getLevelForXP = (totalXP: number): number => {
    let level = 1;
    let xpRequired = 0;
    while (totalXP >= xpRequired) {
        level++;
        xpRequired += level * 100;
    }
    return level - 1;
};

const getXPForNextLevel = (currentLevel: number): number => {
    let xpRequired = 0;
    for (let i = 1; i <= currentLevel + 1; i++) {
        xpRequired += i * 100;
    }
    return xpRequired;
};

const getActivityLevel = (count: number): 0 | 1 | 2 | 3 | 4 => {
    if (count === 0) return 0;
    if (count <= 2) return 1;
    if (count <= 5) return 2;
    if (count <= 10) return 3;
    return 4;
};

// =============================================
// Get Dashboard Data
// =============================================

export const getDashboardData = async (): Promise<IApiResponse<IDashboardData>> => {
    try {
        const user = await getCurrentUser(STAKEHOLDER.USER);
        if (!user) {
            return { success: false, error: 'Unauthorized' };
        }

        const userId = user.userId;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Parallel fetch all data
        const [
            userData,
            userXP,
            userStreak,
            dailyProgress,
            dailyGoal,
            enrollments,
            contentProgress,
            activityFeed,
            xpTransactions,
            activityDays,
        ] = await Promise.all([
            // User basic info
            prisma.user.findUnique({
                where: { id: userId },
                select: { id: true, fullName: true, avatarLink: true },
            }),

            // XP data
            prisma.userXP.findUnique({
                where: { userId },
            }),

            // Streak data
            prisma.userStreak.findUnique({
                where: { userId },
            }),

            // Today's progress
            prisma.userDailyProgress.findUnique({
                where: { userId_date: { userId, date: today } },
            }),

            // Daily goal settings
            prisma.userDailyGoal.findUnique({
                where: { userId },
            }),

            // Course enrollments with progress
            prisma.courseEnrollment.findMany({
                where: { userId, completedAt: null },
                include: {
                    course: {
                        select: {
                            id: true,
                            title: true,
                            slug: true,
                            thumbnailUrl: true,
                        },
                    },
                },
                orderBy: { enrolledAt: 'desc' },
                take: 5,
            }),

            // Content progress (recent)
            prisma.contentProgress.findMany({
                where: { userId, completedAt: null, progress: { gt: 0 } },
                include: {
                    content: {
                        select: {
                            id: true,
                            title: true,
                            slug: true,
                            thumbnailUrl: true,
                        },
                    },
                },
                orderBy: { lastViewedAt: 'desc' },
                take: 5,
            }),

            // Activity feed
            prisma.activityFeed.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                take: 10,
            }),

            // Recent XP transactions for activity
            prisma.xPTransaction.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                take: 10,
            }),

            // Activity calendar data (last 90 days)
            prisma.userDailyProgress.findMany({
                where: {
                    userId,
                    date: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
                },
                select: { date: true, xpEarned: true, contentCompleted: true, problemsSolved: true },
            }),
        ]);

        if (!userData) {
            return { success: false, error: 'User not found' };
        }

        // Calculate user stats
        const totalXP = userXP?.totalXP ?? 0;
        const level = userXP?.level ?? getLevelForXP(totalXP);
        const xpForNextLevel = getXPForNextLevel(level);
        const xpForCurrentLevel = getXPForNextLevel(level - 1);
        const xpInCurrentLevel = totalXP - xpForCurrentLevel;
        const xpNeededForLevel = xpForNextLevel - xpForCurrentLevel;
        const progressToNextLevel = Math.round((xpInCurrentLevel / xpNeededForLevel) * 100);

        // Get user rank
        let rank: number | null = null;
        if (userXP) {
            const higherCount = await prisma.userXP.count({
                where: { totalXP: { gt: totalXP } },
            });
            rank = higherCount + 1;
        }

        const stats: IUserStats = {
            totalXP,
            level,
            xpToNextLevel: xpForNextLevel - totalXP,
            progressToNextLevel: Math.min(100, Math.max(0, progressToNextLevel)),
            currentStreak: userStreak?.currentStreak ?? 0,
            longestStreak: userStreak?.longestStreak ?? 0,
            rank,
        };

        // Daily goal progress
        const xpGoal = dailyGoal?.dailyXPGoal ?? 50;
        const contentGoal = dailyGoal?.dailyContentGoal ?? 1;
        const xpEarned = dailyProgress?.xpEarned ?? 0;
        const contentCompleted = dailyProgress?.contentCompleted ?? 0;

        const dailyProgressData: IDailyGoalProgress = {
            xpEarned,
            xpGoal,
            xpPercentage: Math.min(100, Math.round((xpEarned / xpGoal) * 100)),
            contentCompleted,
            contentGoal,
            contentPercentage: Math.min(100, Math.round((contentCompleted / contentGoal) * 100)),
            lessonsCompleted: dailyProgress?.lessonsCompleted ?? 0,
            problemsSolved: dailyProgress?.problemsSolved ?? 0,
            goalMet: dailyProgress?.goalMet ?? false,
        };

        // Continue learning items
        const continueLearning: IContinueLearningItem[] = [
            ...enrollments.map((e) => ({
                id: e.id,
                type: 'course' as const,
                title: e.course.title,
                slug: `/courses/${e.course.slug}`,
                thumbnailUrl: e.course.thumbnailUrl,
                progress: e.progress,
                lastAccessedAt: e.enrolledAt,
                nextAction: `${e.progress}% complete`,
            })),
            ...contentProgress.map((c) => ({
                id: c.id,
                type: 'content' as const,
                title: c.content.title,
                slug: `/${c.content.slug}`,
                thumbnailUrl: c.content.thumbnailUrl,
                progress: c.progress,
                lastAccessedAt: c.lastViewedAt ?? new Date(),
                nextAction: `${c.progress}% read`,
            })),
        ].sort((a, b) => b.lastAccessedAt.getTime() - a.lastAccessedAt.getTime()).slice(0, 5);

        // Recent activity from XP transactions
        const recentActivity: IRecentActivity[] = xpTransactions.map((t) => ({
            id: t.id,
            type: mapXPTypeToActivityType(t.type),
            description: t.description ?? `Earned ${t.amount} XP`,
            xp: t.amount,
            createdAt: t.createdAt,
            targetId: t.referenceId ?? undefined,
        }));

        // Activity calendar
        const activityCalendar = activityDays.map((d) => ({
            date: d.date.toISOString().split('T')[0],
            count: d.xpEarned + (d.contentCompleted * 10) + (d.problemsSolved * 20),
            level: getActivityLevel(d.xpEarned + (d.contentCompleted * 10) + (d.problemsSolved * 20)),
        }));

        // Get recommendations (trending/popular content)
        const recommendations = await getRecommendations(userId);

        return {
            success: true,
            data: {
                user: userData,
                stats,
                dailyProgress: dailyProgressData,
                continueLearning,
                recentActivity,
                recommendations,
                activityCalendar,
            },
        };
    } catch (error) {
        console.error('[getDashboardData] Error:', error);
        return { success: false, error: 'Failed to fetch dashboard data' };
    }
};

// =============================================
// Helper: Map XP Type to Activity Type
// =============================================

const mapXPTypeToActivityType = (type: string): IRecentActivity['type'] => {
    switch (type) {
        case 'COMPLETE_LESSON':
            return 'LESSON_COMPLETED';
        case 'SOLVE_PROBLEM_EASY':
        case 'SOLVE_PROBLEM_MEDIUM':
        case 'SOLVE_PROBLEM_HARD':
            return 'PROBLEM_SOLVED';
        case 'READ_CONTENT':
        case 'COMPLETE_CONTENT':
            return 'CONTENT_READ';
        case 'COMPLETE_COURSE':
            return 'COURSE_ENROLLED';
        default:
            return 'XP_EARNED';
    }
};

// =============================================
// Get Recommendations
// =============================================

const getRecommendations = async (userId: string): Promise<IRecommendation[]> => {
    try {
        // Get user's interests from topics they follow
        const followedTopics = await prisma.topicFollower.findMany({
            where: { userId },
            select: { topicId: true },
        });

        const topicIds = followedTopics.map((t) => t.topicId);

        // Get enrolled course IDs to exclude
        const enrolledCourses = await prisma.courseEnrollment.findMany({
            where: { userId },
            select: { courseId: true },
        });
        const enrolledCourseIds = enrolledCourses.map((e) => e.courseId);

        // Get trending courses
        const trendingCourses = await prisma.course.findMany({
            where: {
                status: 'PUBLISHED',
                id: { notIn: enrolledCourseIds },
            },
            orderBy: { enrollmentCount: 'desc' },
            take: 3,
            select: {
                id: true,
                title: true,
                slug: true,
                thumbnailUrl: true,
                difficulty: true,
            },
        });

        // Get popular content
        const popularContent = await prisma.content.findMany({
            where: {
                status: 'PUBLISHED',
                ...(topicIds.length > 0
                    ? { topics: { some: { topicId: { in: topicIds } } } }
                    : {}),
            },
            orderBy: { viewCount: 'desc' },
            take: 3,
            select: {
                id: true,
                title: true,
                slug: true,
                thumbnailUrl: true,
                difficulty: true,
            },
        });

        const recommendations: IRecommendation[] = [
            ...trendingCourses.map((c) => ({
                id: c.id,
                type: 'course' as const,
                title: c.title,
                slug: `/courses/${c.slug}`,
                thumbnailUrl: c.thumbnailUrl,
                difficulty: c.difficulty,
                reason: 'Trending',
            })),
            ...popularContent.map((c) => ({
                id: c.id,
                type: 'content' as const,
                title: c.title,
                slug: `/${c.slug}`,
                thumbnailUrl: c.thumbnailUrl,
                difficulty: c.difficulty,
                reason: topicIds.length > 0 ? 'Based on your interests' : 'Popular',
            })),
        ];

        return recommendations.slice(0, 5);
    } catch (error) {
        console.error('[getRecommendations] Error:', error);
        return [];
    }
};

// =============================================
// Get User Streak Data
// =============================================

export const getUserStreak = async (): Promise<
    IApiResponse<{
        currentStreak: number;
        longestStreak: number;
        lastActiveAt: Date | null;
    }>
> => {
    try {
        const user = await getCurrentUser(STAKEHOLDER.USER);
        if (!user) {
            return { success: false, error: 'Unauthorized' };
        }

        const streak = await prisma.userStreak.findUnique({
            where: { userId: user.userId },
        });

        return {
            success: true,
            data: {
                currentStreak: streak?.currentStreak ?? 0,
                longestStreak: streak?.longestStreak ?? 0,
                lastActiveAt: streak?.lastActiveAt ?? null,
            },
        };
    } catch (error) {
        console.error('[getUserStreak] Error:', error);
        return { success: false, error: 'Failed to fetch streak data' };
    }
};

// =============================================
// Get Activity Calendar Data
// =============================================

export const getActivityCalendarData = async (
    days = 365,
): Promise<
    IApiResponse<{
        activities: Array<{ date: string; count: number; level: 0 | 1 | 2 | 3 | 4 }>;
        stats: {
            totalContributions: number;
            activeDays: number;
            maxStreak: number;
        };
    }>
> => {
    try {
        const user = await getCurrentUser(STAKEHOLDER.USER);
        if (!user) {
            return { success: false, error: 'Unauthorized' };
        }

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        startDate.setHours(0, 0, 0, 0);

        const dailyProgress = await prisma.userDailyProgress.findMany({
            where: {
                userId: user.userId,
                date: { gte: startDate },
            },
            orderBy: { date: 'asc' },
        });

        const activities = dailyProgress.map((d) => ({
            date: d.date.toISOString().split('T')[0],
            count: d.xpEarned + (d.contentCompleted * 10) + (d.problemsSolved * 20),
            level: getActivityLevel(d.xpEarned + (d.contentCompleted * 10) + (d.problemsSolved * 20)),
        }));

        const totalContributions = activities.reduce((sum, a) => sum + a.count, 0);
        const activeDays = activities.filter((a) => a.count > 0).length;

        // Calculate max streak from streak table
        const streak = await prisma.userStreak.findUnique({
            where: { userId: user.userId },
        });

        return {
            success: true,
            data: {
                activities,
                stats: {
                    totalContributions,
                    activeDays,
                    maxStreak: streak?.longestStreak ?? 0,
                },
            },
        };
    } catch (error) {
        console.error('[getActivityCalendarData] Error:', error);
        return { success: false, error: 'Failed to fetch activity data' };
    }
};

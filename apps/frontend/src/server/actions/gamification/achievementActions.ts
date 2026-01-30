'use server';

// =============================================
// Achievement & Badge Actions
// =============================================

import { STAKEHOLDER } from '@/constants/auth.constants';
import { getCurrentUser } from '@/lib/auth';
import { type IApiResponse } from '@/lib/interfaces';
import { prisma } from '@/server/db/prisma';
import { awardXP } from './xpActions';

// =============================================
// Types
// =============================================

export interface IAchievement {
    id: string;
    slug: string;
    name: string;
    description: string;
    icon: string | null;
    category: string;
    xpReward: number;
    isSecret: boolean;
    isUnlocked: boolean;
    unlockedAt: Date | null;
}

export interface IBadge {
    id: string;
    slug: string;
    name: string;
    description: string;
    icon: string | null;
    color: string | null;
    rarity: string;
    isAwarded: boolean;
    awardedAt: Date | null;
    isDisplayed: boolean;
}

// =============================================
// Achievement Conditions
// =============================================

interface IAchievementCondition {
    type: 'count' | 'streak' | 'level' | 'first' | 'complete';
    metric: string;
    target: number;
}

const checkCondition = async (userId: string, condition: IAchievementCondition): Promise<boolean> => {
    switch (condition.type) {
        case 'count': {
            const count = await getMetricCount(userId, condition.metric);
            return count >= condition.target;
        }
        case 'streak': {
            const streak = await prisma.userStreak.findUnique({ where: { userId } });
            if (condition.metric === 'current') {
                return (streak?.currentStreak ?? 0) >= condition.target;
            }
            return (streak?.longestStreak ?? 0) >= condition.target;
        }
        case 'level': {
            const xp = await prisma.userXP.findUnique({ where: { userId } });
            return (xp?.level ?? 1) >= condition.target;
        }
        case 'first': {
            const count = await getMetricCount(userId, condition.metric);
            return count >= 1;
        }
        case 'complete': {
            const count = await getMetricCount(userId, condition.metric);
            return count >= condition.target;
        }
        default:
            return false;
    }
};

const getMetricCount = async (userId: string, metric: string): Promise<number> => {
    switch (metric) {
        case 'articles_read':
            return prisma.contentProgress.count({
                where: {
                    userId,
                    completedAt: { not: null },
                    content: { type: 'ARTICLE' },
                },
            });
        case 'tutorials_completed':
            return prisma.contentProgress.count({
                where: {
                    userId,
                    completedAt: { not: null },
                    content: { type: 'TUTORIAL' },
                },
            });
        case 'courses_completed':
            return prisma.courseEnrollment.count({
                where: { userId, completedAt: { not: null } },
            });
        case 'lessons_completed':
            return prisma.lessonProgress.count({
                where: { userId, completed: true },
            });
        case 'problems_solved':
            return prisma.practiceSubmission.count({
                where: { userId, status: 'PASSED' },
            });
        case 'comments_posted':
            return prisma.comment.count({ where: { userId } });
        case 'content_liked':
            return prisma.contentLike.count({ where: { userId } });
        case 'bookmarks_created':
            return prisma.bookmark.count({ where: { userId } });
        case 'total_xp':
            const xp = await prisma.userXP.findUnique({ where: { userId } });
            return xp?.totalXP ?? 0;
        case 'daily_goals_met':
            return prisma.userDailyProgress.count({
                where: { userId, goalMet: true },
            });
        case 'creators_followed':
            return prisma.creatorFollower.count({ where: { userId } });
        case 'topics_followed':
            return prisma.topicFollower.count({ where: { userId } });
        default:
            return 0;
    }
};

// =============================================
// Check & Award Achievements
// =============================================

export const checkAndAwardAchievements = async (): Promise<
    IApiResponse<{ newAchievements: IAchievement[] }>
> => {
    try {
        const user = await getCurrentUser(STAKEHOLDER.USER);
        if (!user) {
            return { success: false, error: 'Unauthorized' };
        }

        // Get all achievements
        const allAchievements = await prisma.achievement.findMany();

        // Get already unlocked achievements
        const unlockedIds = (
            await prisma.userAchievement.findMany({
                where: { userId: user.userId },
                select: { achievementId: true },
            })
        ).map((a) => a.achievementId);

        const newAchievements: IAchievement[] = [];

        // Check each locked achievement
        for (const achievement of allAchievements) {
            if (unlockedIds.includes(achievement.id)) continue;

            const condition = achievement.condition as IAchievementCondition;
            const isUnlocked = await checkCondition(user.userId, condition);

            if (isUnlocked) {
                // Award achievement
                await prisma.userAchievement.create({
                    data: {
                        userId: user.userId,
                        achievementId: achievement.id,
                    },
                });

                // Award XP for achievement
                if (achievement.xpReward > 0) {
                    await awardXP(
                        'ACHIEVEMENT_BONUS',
                        achievement.id,
                        `Achievement unlocked: ${achievement.name}`,
                        achievement.xpReward,
                    );
                }

                // Create notification
                await prisma.notification.create({
                    data: {
                        userId: user.userId,
                        type: 'ACHIEVEMENT',
                        title: 'Achievement Unlocked!',
                        message: `You earned "${achievement.name}"`,
                        link: '/profile/achievements',
                        metadata: {
                            achievementId: achievement.id,
                            xpReward: achievement.xpReward,
                        },
                    },
                });

                // Create activity feed entry
                await prisma.activityFeed.create({
                    data: {
                        userId: user.userId,
                        type: 'ACHIEVEMENT_UNLOCKED',
                        targetId: achievement.id,
                        metadata: {
                            name: achievement.name,
                            icon: achievement.icon,
                        },
                        isPublic: true,
                    },
                });

                newAchievements.push({
                    id: achievement.id,
                    slug: achievement.slug,
                    name: achievement.name,
                    description: achievement.description,
                    icon: achievement.icon,
                    category: achievement.category,
                    xpReward: achievement.xpReward,
                    isSecret: achievement.isSecret,
                    isUnlocked: true,
                    unlockedAt: new Date(),
                });
            }
        }

        return {
            success: true,
            data: { newAchievements },
        };
    } catch (error) {
        console.error('[checkAndAwardAchievements] Error:', error);
        return { success: false, error: 'Failed to check achievements' };
    }
};

// =============================================
// Get User Achievements
// =============================================

export const getUserAchievements = async (userId?: string): Promise<IApiResponse<{ achievements: IAchievement[] }>> => {
    try {
        const targetUserId = userId ?? (await getCurrentUser(STAKEHOLDER.USER))?.userId;
        if (!targetUserId) {
            return { success: false, error: 'User not found' };
        }

        // Get all non-secret achievements
        const allAchievements = await prisma.achievement.findMany({
            where: { isSecret: false },
            orderBy: [{ category: 'asc' }, { order: 'asc' }],
        });

        // Get user's unlocked achievements
        const userAchievements = await prisma.userAchievement.findMany({
            where: { userId: targetUserId },
            include: { achievement: true },
        });

        const unlockedMap = new Map(userAchievements.map((ua) => [ua.achievementId, ua.unlockedAt]));

        const achievements: IAchievement[] = allAchievements.map((a) => ({
            id: a.id,
            slug: a.slug,
            name: a.name,
            description: a.description,
            icon: a.icon,
            category: a.category,
            xpReward: a.xpReward,
            isSecret: a.isSecret,
            isUnlocked: unlockedMap.has(a.id),
            unlockedAt: unlockedMap.get(a.id) ?? null,
        }));

        // Add secret achievements that are unlocked
        const unlockedSecretAchievements = userAchievements
            .filter((ua) => ua.achievement.isSecret)
            .map((ua) => ({
                id: ua.achievement.id,
                slug: ua.achievement.slug,
                name: ua.achievement.name,
                description: ua.achievement.description,
                icon: ua.achievement.icon,
                category: ua.achievement.category,
                xpReward: ua.achievement.xpReward,
                isSecret: true,
                isUnlocked: true,
                unlockedAt: ua.unlockedAt,
            }));

        return {
            success: true,
            data: { achievements: [...achievements, ...unlockedSecretAchievements] },
        };
    } catch (error) {
        console.error('[getUserAchievements] Error:', error);
        return { success: false, error: 'Failed to fetch achievements' };
    }
};

// =============================================
// Get Achievement Stats
// =============================================

export const getAchievementStats = async (): Promise<
    IApiResponse<{
        total: number;
        unlocked: number;
        xpEarned: number;
        byCategory: Array<{ category: string; total: number; unlocked: number }>;
    }>
> => {
    try {
        const user = await getCurrentUser(STAKEHOLDER.USER);
        if (!user) {
            return { success: false, error: 'Unauthorized' };
        }

        const [allAchievements, userAchievements] = await Promise.all([
            prisma.achievement.findMany({
                where: { isSecret: false },
            }),
            prisma.userAchievement.findMany({
                where: { userId: user.userId },
                include: { achievement: true },
            }),
        ]);

        const unlockedIds = new Set(userAchievements.map((ua) => ua.achievementId));
        const xpEarned = userAchievements.reduce((sum, ua) => sum + ua.achievement.xpReward, 0);

        // Group by category
        const categoryMap = new Map<string, { total: number; unlocked: number }>();
        for (const a of allAchievements) {
            const current = categoryMap.get(a.category) ?? { total: 0, unlocked: 0 };
            current.total++;
            if (unlockedIds.has(a.id)) current.unlocked++;
            categoryMap.set(a.category, current);
        }

        return {
            success: true,
            data: {
                total: allAchievements.length,
                unlocked: userAchievements.length,
                xpEarned,
                byCategory: Array.from(categoryMap.entries()).map(([category, stats]) => ({
                    category,
                    ...stats,
                })),
            },
        };
    } catch (error) {
        console.error('[getAchievementStats] Error:', error);
        return { success: false, error: 'Failed to fetch achievement stats' };
    }
};

// =============================================
// Get User Badges
// =============================================

export const getUserBadges = async (userId?: string): Promise<IApiResponse<{ badges: IBadge[] }>> => {
    try {
        const targetUserId = userId ?? (await getCurrentUser(STAKEHOLDER.USER))?.userId;
        if (!targetUserId) {
            return { success: false, error: 'User not found' };
        }

        // Get all badges
        const allBadges = await prisma.badge.findMany({
            orderBy: [{ rarity: 'desc' }],
        });

        // Get user's badges
        const userBadges = await prisma.userBadge.findMany({
            where: { userId: targetUserId },
        });

        const awardedMap = new Map(
            userBadges.map((ub) => [ub.badgeId, { awardedAt: ub.awardedAt, isDisplayed: ub.isDisplayed }]),
        );

        const badges: IBadge[] = allBadges.map((b) => ({
            id: b.id,
            slug: b.slug,
            name: b.name,
            description: b.description,
            icon: b.icon,
            color: b.color,
            rarity: b.rarity,
            isAwarded: awardedMap.has(b.id),
            awardedAt: awardedMap.get(b.id)?.awardedAt ?? null,
            isDisplayed: awardedMap.get(b.id)?.isDisplayed ?? false,
        }));

        return {
            success: true,
            data: { badges },
        };
    } catch (error) {
        console.error('[getUserBadges] Error:', error);
        return { success: false, error: 'Failed to fetch badges' };
    }
};

// =============================================
// Toggle Badge Display
// =============================================

export const toggleBadgeDisplay = async (badgeId: string): Promise<IApiResponse<{ isDisplayed: boolean }>> => {
    try {
        const user = await getCurrentUser(STAKEHOLDER.USER);
        if (!user) {
            return { success: false, error: 'Unauthorized' };
        }

        const userBadge = await prisma.userBadge.findUnique({
            where: {
                userId_badgeId: {
                    userId: user.userId,
                    badgeId,
                },
            },
        });

        if (!userBadge) {
            return { success: false, error: 'Badge not found' };
        }

        const updated = await prisma.userBadge.update({
            where: { id: userBadge.id },
            data: { isDisplayed: !userBadge.isDisplayed },
        });

        return {
            success: true,
            data: { isDisplayed: updated.isDisplayed },
        };
    } catch (error) {
        console.error('[toggleBadgeDisplay] Error:', error);
        return { success: false, error: 'Failed to toggle badge display' };
    }
};

// =============================================
// Award Badge (Admin/System Only)
// =============================================

export const awardBadge = async (
    userId: string,
    badgeSlug: string,
): Promise<IApiResponse<{ success: boolean }>> => {
    try {
        const badge = await prisma.badge.findUnique({
            where: { slug: badgeSlug },
        });

        if (!badge) {
            return { success: false, error: 'Badge not found' };
        }

        // Check if already awarded
        const existing = await prisma.userBadge.findUnique({
            where: {
                userId_badgeId: {
                    userId,
                    badgeId: badge.id,
                },
            },
        });

        if (existing) {
            return { success: true, data: { success: true }, message: 'Badge already awarded' };
        }

        await prisma.userBadge.create({
            data: {
                userId,
                badgeId: badge.id,
            },
        });

        // Create notification
        await prisma.notification.create({
            data: {
                userId,
                type: 'BADGE',
                title: 'New Badge Earned!',
                message: `You earned the "${badge.name}" badge`,
                link: '/profile/badges',
                metadata: {
                    badgeId: badge.id,
                    rarity: badge.rarity,
                },
            },
        });

        // Create activity feed entry
        await prisma.activityFeed.create({
            data: {
                userId,
                type: 'BADGE_EARNED',
                targetId: badge.id,
                metadata: {
                    name: badge.name,
                    rarity: badge.rarity,
                    icon: badge.icon,
                },
                isPublic: true,
            },
        });

        return { success: true, data: { success: true } };
    } catch (error) {
        console.error('[awardBadge] Error:', error);
        return { success: false, error: 'Failed to award badge' };
    }
};

// =============================================
// Get Displayed Badges (For Profile)
// =============================================

export const getDisplayedBadges = async (
    userId: string,
): Promise<IApiResponse<{ badges: Array<{ name: string; icon: string | null; color: string | null; rarity: string }> }>> => {
    try {
        const userBadges = await prisma.userBadge.findMany({
            where: {
                userId,
                isDisplayed: true,
            },
            include: { badge: true },
            take: 5, // Max 5 displayed badges
        });

        return {
            success: true,
            data: {
                badges: userBadges.map((ub) => ({
                    name: ub.badge.name,
                    icon: ub.badge.icon,
                    color: ub.badge.color,
                    rarity: ub.badge.rarity,
                })),
            },
        };
    } catch (error) {
        console.error('[getDisplayedBadges] Error:', error);
        return { success: false, error: 'Failed to fetch displayed badges' };
    }
};

'use server';
// =============================================
// Public Profile Actions - View any user's public profile
// =============================================

import { STAKEHOLDER } from '@/constants/auth.constants';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/server/db/prisma';

// =============================================
// Types
// =============================================

export interface IPublicUserProfile {
    id: string;
    fullName: string;
    username: string | null;
    avatarLink: string | null;
    bio: string | null;
    createdAt: Date;
    isFollowing: boolean;
    isOwnProfile: boolean;
    stats: {
        followers: number;
        following: number;
        contentCompleted: number;
        coursesCompleted: number;
        problemsSolved: number;
        totalXP: number;
        level: number;
        currentStreak: number;
        longestStreak: number;
        achievementsCount: number;
        badgesCount: number;
    };
}

interface IPublicProfileResponse {
    success: boolean;
    data?: IPublicUserProfile;
    error?: string;
}

// =============================================
// Get Public User Profile by Username or ID
// =============================================

export const getPublicUserProfile = async (
    identifier: string
): Promise<IPublicProfileResponse> => {
    try {
        const currentUser = await getCurrentUser(STAKEHOLDER.USER);

        // Find user by username or ID
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { username: identifier },
                    { id: identifier },
                ],
                isActive: true,
            },
            select: {
                id: true,
                fullName: true,
                username: true,
                avatarLink: true,
                bio: true,
                createdAt: true,
            },
        });

        if (!user) {
            return { success: false, error: 'User not found' };
        }

        const isOwnProfile = currentUser?.userId === user.id;

        // Fetch stats in parallel
        const [
            followersCount,
            followingCount,
            contentCompleted,
            coursesCompleted,
            problemsSolved,
            xpData,
            streak,
            achievementsCount,
            badgesCount,
            isFollowing,
        ] = await Promise.all([
            prisma.userFollow.count({ where: { followingId: user.id } }),
            prisma.userFollow.count({ where: { followerId: user.id } }),
            prisma.contentProgress.count({
                where: { userId: user.id, completedAt: { not: null } },
            }),
            prisma.courseEnrollment.count({
                where: { userId: user.id, completedAt: { not: null } },
            }),
            prisma.practiceSubmission.count({
                where: { userId: user.id, status: 'PASSED' },
            }),
            prisma.userXP.findUnique({
                where: { userId: user.id },
                select: { totalXP: true, level: true },
            }),
            prisma.userStreak.findUnique({
                where: { userId: user.id },
                select: { currentStreak: true, longestStreak: true },
            }),
            prisma.userAchievement.count({ where: { userId: user.id } }),
            prisma.userBadge.count({ where: { userId: user.id } }),
            currentUser
                ? prisma.userFollow.findUnique({
                      where: {
                          followerId_followingId: {
                              followerId: currentUser.userId,
                              followingId: user.id,
                          },
                      },
                  })
                : null,
        ]);

        return {
            success: true,
            data: {
                id: user.id,
                fullName: user.fullName,
                username: user.username,
                avatarLink: user.avatarLink,
                bio: user.bio,
                createdAt: user.createdAt,
                isFollowing: !!isFollowing,
                isOwnProfile,
                stats: {
                    followers: followersCount,
                    following: followingCount,
                    contentCompleted,
                    coursesCompleted,
                    problemsSolved,
                    totalXP: xpData?.totalXP ?? 0,
                    level: xpData?.level ?? 1,
                    currentStreak: streak?.currentStreak ?? 0,
                    longestStreak: streak?.longestStreak ?? 0,
                    achievementsCount,
                    badgesCount,
                },
            },
        };
    } catch (error) {
        console.error('getPublicUserProfile error:', error);
        return { success: false, error: 'Failed to fetch profile' };
    }
};

// =============================================
// Get User's Displayed Badges
// =============================================

export const getUserDisplayedBadges = async (
    userId: string
): Promise<{
    success: boolean;
    data?: Array<{
        id: string;
        name: string;
        description: string;
        icon: string | null;
        color: string | null;
        rarity: string;
        awardedAt: Date;
    }>;
    error?: string;
}> => {
    try {
        const userBadges = await prisma.userBadge.findMany({
            where: {
                userId,
                isDisplayed: true,
            },
            orderBy: { awardedAt: 'desc' },
            take: 5,
        });

        // Fetch badge details separately
        const badgeIds = userBadges.map((ub) => ub.badgeId);
        const badges = await prisma.badge.findMany({
            where: { id: { in: badgeIds } },
            select: {
                id: true,
                name: true,
                description: true,
                icon: true,
                color: true,
                rarity: true,
            },
        });

        const badgeMap = new Map(badges.map((b) => [b.id, b]));

        return {
            success: true,
            data: userBadges
                .map((ub) => {
                    const badge = badgeMap.get(ub.badgeId);
                    if (!badge) return null;
                    return {
                        id: badge.id,
                        name: badge.name,
                        description: badge.description,
                        icon: badge.icon,
                        color: badge.color,
                        rarity: badge.rarity,
                        awardedAt: ub.awardedAt,
                    };
                })
                .filter((b): b is NonNullable<typeof b> => b !== null),
        };
    } catch (error) {
        console.error('getUserDisplayedBadges error:', error);
        return { success: false, error: 'Failed to fetch badges' };
    }
};

// =============================================
// Get User's Recent Achievements
// =============================================

export const getUserRecentAchievements = async (
    userId: string,
    limit: number = 5
): Promise<{
    success: boolean;
    data?: Array<{
        id: string;
        name: string;
        description: string;
        icon: string | null;
        category: string;
        unlockedAt: Date;
    }>;
    error?: string;
}> => {
    try {
        const userAchievements = await prisma.userAchievement.findMany({
            where: { userId },
            orderBy: { unlockedAt: 'desc' },
            take: limit,
        });

        // Fetch achievement details separately
        const achievementIds = userAchievements.map((ua) => ua.achievementId);
        const achievements = await prisma.achievement.findMany({
            where: { id: { in: achievementIds } },
            select: {
                id: true,
                name: true,
                description: true,
                icon: true,
                category: true,
            },
        });

        const achievementMap = new Map(achievements.map((a) => [a.id, a]));

        return {
            success: true,
            data: userAchievements
                .map((ua) => {
                    const achievement = achievementMap.get(ua.achievementId);
                    if (!achievement) return null;
                    return {
                        id: achievement.id,
                        name: achievement.name,
                        description: achievement.description,
                        icon: achievement.icon,
                        category: achievement.category,
                        unlockedAt: ua.unlockedAt,
                    };
                })
                .filter((a): a is NonNullable<typeof a> => a !== null),
        };
    } catch (error) {
        console.error('getUserRecentAchievements error:', error);
        return { success: false, error: 'Failed to fetch achievements' };
    }
};

// =============================================
// Search Users
// =============================================

export const searchUsers = async (params: {
    query?: string;
    page?: number;
    limit?: number;
    sortBy?: 'followers' | 'xp' | 'recent';
}): Promise<{
    success: boolean;
    data?: Array<{
        id: string;
        fullName: string;
        username: string | null;
        avatarLink: string | null;
        bio: string | null;
        followersCount: number;
        level: number;
        isFollowing: boolean;
    }>;
    total?: number;
    error?: string;
}> => {
    try {
        const currentUser = await getCurrentUser(STAKEHOLDER.USER);
        const { query, page = 1, limit = 20, sortBy = 'followers' } = params;

        const where = {
            isActive: true,
            ...(query && {
                OR: [
                    { fullName: { contains: query, mode: 'insensitive' as const } },
                    { username: { contains: query, mode: 'insensitive' as const } },
                ],
            }),
        };

        // Determine sort order
        let orderBy: Record<string, unknown> = {};
        switch (sortBy) {
            case 'xp':
                // Will be handled post-query for now
                orderBy = { createdAt: 'desc' };
                break;
            case 'recent':
                orderBy = { createdAt: 'desc' };
                break;
            case 'followers':
            default:
                orderBy = { followers: { _count: 'desc' } };
        }

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                select: {
                    id: true,
                    fullName: true,
                    username: true,
                    avatarLink: true,
                    bio: true,
                    _count: {
                        select: { followers: true },
                    },
                    xp: {
                        select: { level: true },
                    },
                },
                orderBy,
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.user.count({ where }),
        ]);

        // Check following status for current user
        let followingSet = new Set<string>();
        if (currentUser) {
            const following = await prisma.userFollow.findMany({
                where: {
                    followerId: currentUser.userId,
                    followingId: { in: users.map((u) => u.id) },
                },
                select: { followingId: true },
            });
            followingSet = new Set(following.map((f) => f.followingId));
        }

        return {
            success: true,
            data: users.map((u) => ({
                id: u.id,
                fullName: u.fullName,
                username: u.username,
                avatarLink: u.avatarLink,
                bio: u.bio,
                followersCount: u._count.followers,
                level: u.xp?.level ?? 1,
                isFollowing: followingSet.has(u.id),
            })),
            total,
        };
    } catch (error) {
        console.error('searchUsers error:', error);
        return { success: false, error: 'Failed to search users' };
    }
};

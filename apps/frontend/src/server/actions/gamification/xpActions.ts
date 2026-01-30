'use server';

// =============================================
// XP & Points Actions - Gamification System
// =============================================

import { STAKEHOLDER } from '@/constants/auth.constants';
import { getCurrentUser } from '@/lib/auth';
import { type IApiResponse } from '@/lib/interfaces';
import { prisma } from '@/server/db/prisma';

// =============================================
// XP Values Configuration
// =============================================

export const XP_VALUES = {
    READ_CONTENT: 5, // Started reading
    COMPLETE_CONTENT: 15, // Finished article/tutorial
    LIKE_CONTENT: 2, // Liked something
    COMMENT: 5, // Posted a comment
    COMPLETE_LESSON: 10, // Finished a course lesson
    COMPLETE_SECTION: 25, // Finished a course section
    COMPLETE_COURSE: 100, // Finished entire course
    SOLVE_PROBLEM_EASY: 10,
    SOLVE_PROBLEM_MEDIUM: 25,
    SOLVE_PROBLEM_HARD: 50,
    DAILY_STREAK_BONUS: 10, // Per day of streak
    WEEKLY_STREAK_BONUS: 50, // 7-day streak
    FIRST_OF_TYPE: 20, // First article, first course, etc.
    ACHIEVEMENT_BONUS: 25, // Base XP for achievements
} as const;

export type XPType = keyof typeof XP_VALUES;

// =============================================
// Level Thresholds
// =============================================

const getLevelForXP = (totalXP: number): number => {
    // Each level requires progressively more XP
    // Level 1: 0-99, Level 2: 100-299, Level 3: 300-599, etc.
    // Formula: Level N requires (N-1) * 100 + sum of previous levels
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

// =============================================
// Types
// =============================================

export interface IUserXPData {
    totalXP: number;
    weeklyXP: number;
    monthlyXP: number;
    level: number;
    xpToNextLevel: number;
    progressToNextLevel: number; // 0-100 percentage
}

export interface IXPTransaction {
    id: string;
    amount: number;
    type: string;
    description: string | null;
    createdAt: Date;
}

export interface ILeaderboardEntry {
    rank: number;
    userId: string;
    fullName: string;
    avatarLink: string | null;
    xp: number;
    level: number;
    isCurrentUser: boolean;
}

// =============================================
// Award XP to User
// =============================================

export const awardXP = async (
    type: XPType,
    referenceId?: string,
    description?: string,
    customAmount?: number,
): Promise<IApiResponse<{ xpAwarded: number; newTotal: number; levelUp: boolean; newLevel: number }>> => {
    try {
        const user = await getCurrentUser(STAKEHOLDER.USER);
        if (!user) {
            return { success: false, error: 'Unauthorized' };
        }

        const amount = customAmount ?? XP_VALUES[type];

        // Check for duplicate transaction (prevent gaming)
        if (referenceId) {
            const existing = await prisma.xPTransaction.findFirst({
                where: {
                    userId: user.userId,
                    type,
                    referenceId,
                },
            });
            if (existing) {
                return {
                    success: true,
                    data: {
                        xpAwarded: 0,
                        newTotal: 0,
                        levelUp: false,
                        newLevel: 0,
                    },
                    message: 'XP already awarded for this action',
                };
            }
        }

        // Create transaction
        await prisma.xPTransaction.create({
            data: {
                userId: user.userId,
                amount,
                type,
                referenceId,
                description: description ?? `Earned ${amount} XP for ${type.toLowerCase().replace(/_/g, ' ')}`,
            },
        });

        // Update user XP
        const userXP = await prisma.userXP.upsert({
            where: { userId: user.userId },
            create: {
                userId: user.userId,
                totalXP: amount,
                weeklyXP: amount,
                monthlyXP: amount,
                level: getLevelForXP(amount),
            },
            update: {
                totalXP: { increment: amount },
                weeklyXP: { increment: amount },
                monthlyXP: { increment: amount },
            },
        });

        const newLevel = getLevelForXP(userXP.totalXP);
        const levelUp = newLevel > userXP.level;

        // Update level if changed
        if (levelUp) {
            await prisma.userXP.update({
                where: { userId: user.userId },
                data: { level: newLevel },
            });
        }

        // Update daily progress
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        await prisma.userDailyProgress.upsert({
            where: {
                userId_date: {
                    userId: user.userId,
                    date: today,
                },
            },
            create: {
                userId: user.userId,
                date: today,
                xpEarned: amount,
            },
            update: {
                xpEarned: { increment: amount },
            },
        });

        // Create activity feed entry for significant XP gains
        if (amount >= 50) {
            await prisma.activityFeed.create({
                data: {
                    userId: user.userId,
                    type: 'XP_EARNED',
                    targetId: referenceId,
                    metadata: { amount, type },
                    isPublic: true,
                },
            });
        }

        return {
            success: true,
            data: {
                xpAwarded: amount,
                newTotal: userXP.totalXP,
                levelUp,
                newLevel,
            },
        };
    } catch (error) {
        console.error('[awardXP] Error:', error);
        return { success: false, error: 'Failed to award XP' };
    }
};

// =============================================
// Get User XP Data
// =============================================

export const getUserXP = async (userId?: string): Promise<IApiResponse<IUserXPData>> => {
    try {
        const targetUserId = userId ?? (await getCurrentUser(STAKEHOLDER.USER))?.userId;
        if (!targetUserId) {
            return { success: false, error: 'User not found' };
        }

        const userXP = await prisma.userXP.findUnique({
            where: { userId: targetUserId },
        });

        if (!userXP) {
            // Return default values for users without XP
            return {
                success: true,
                data: {
                    totalXP: 0,
                    weeklyXP: 0,
                    monthlyXP: 0,
                    level: 1,
                    xpToNextLevel: 100,
                    progressToNextLevel: 0,
                },
            };
        }

        const xpForNextLevel = getXPForNextLevel(userXP.level);
        const xpForCurrentLevel = getXPForNextLevel(userXP.level - 1);
        const xpInCurrentLevel = userXP.totalXP - xpForCurrentLevel;
        const xpNeededForLevel = xpForNextLevel - xpForCurrentLevel;
        const progressToNextLevel = Math.round((xpInCurrentLevel / xpNeededForLevel) * 100);

        return {
            success: true,
            data: {
                totalXP: userXP.totalXP,
                weeklyXP: userXP.weeklyXP,
                monthlyXP: userXP.monthlyXP,
                level: userXP.level,
                xpToNextLevel: xpForNextLevel - userXP.totalXP,
                progressToNextLevel: Math.min(100, Math.max(0, progressToNextLevel)),
            },
        };
    } catch (error) {
        console.error('[getUserXP] Error:', error);
        return { success: false, error: 'Failed to fetch XP data' };
    }
};

// =============================================
// Get XP Transaction History
// =============================================

export const getXPHistory = async (
    limit = 20,
    offset = 0,
): Promise<IApiResponse<{ transactions: Array<IXPTransaction>; total: number }>> => {
    try {
        const user = await getCurrentUser(STAKEHOLDER.USER);
        if (!user) {
            return { success: false, error: 'Unauthorized' };
        }

        const [transactions, total] = await Promise.all([
            prisma.xPTransaction.findMany({
                where: { userId: user.userId },
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip: offset,
            }),
            prisma.xPTransaction.count({ where: { userId: user.userId } }),
        ]);

        return {
            success: true,
            data: {
                transactions: transactions.map((t) => ({
                    id: t.id,
                    amount: t.amount,
                    type: t.type,
                    description: t.description,
                    createdAt: t.createdAt,
                })),
                total,
            },
        };
    } catch (error) {
        console.error('[getXPHistory] Error:', error);
        return { success: false, error: 'Failed to fetch XP history' };
    }
};

// =============================================
// Get Leaderboard
// =============================================

export const getLeaderboard = async (
    period: 'weekly' | 'monthly' | 'allTime' = 'weekly',
    limit = 100,
): Promise<IApiResponse<{ entries: Array<ILeaderboardEntry>; currentUserRank: number | null }>> => {
    try {
        const currentUser = await getCurrentUser(STAKEHOLDER.USER);
        const orderByField = period === 'weekly' ? 'weeklyXP' : period === 'monthly' ? 'monthlyXP' : 'totalXP';

        // Get top users
        const topUsers = await prisma.userXP.findMany({
            orderBy: { [orderByField]: 'desc' },
            take: limit,
            include: {
                user: {
                    select: {
                        id: true,
                        fullName: true,
                        avatarLink: true,
                    },
                },
            },
        });

        const entries: Array<ILeaderboardEntry> = topUsers.map((entry, index) => ({
            rank: index + 1,
            userId: entry.userId,
            fullName: entry.user.fullName,
            avatarLink: entry.user.avatarLink,
            xp: entry[orderByField],
            level: entry.level,
            isCurrentUser: currentUser?.userId === entry.userId,
        }));

        // Get current user's rank if not in top list
        let currentUserRank: number | null = null;
        if (currentUser) {
            const userInList = entries.find((e) => e.isCurrentUser);
            if (userInList) {
                currentUserRank = userInList.rank;
            } else {
                // Count users with higher XP
                const higherCount = await prisma.userXP.count({
                    where: {
                        [orderByField]: {
                            gt: (
                                await prisma.userXP.findUnique({
                                    where: { userId: currentUser.userId },
                                    select: { [orderByField]: true },
                                })
                            )?.[orderByField] ?? 0,
                        },
                    },
                });
                currentUserRank = higherCount + 1;
            }
        }

        return {
            success: true,
            data: { entries, currentUserRank },
        };
    } catch (error) {
        console.error('[getLeaderboard] Error:', error);
        return { success: false, error: 'Failed to fetch leaderboard' };
    }
};

// =============================================
// Reset Weekly/Monthly XP (For Cron Jobs)
// =============================================

export const resetWeeklyXP = async (): Promise<IApiResponse<{ resetCount: number }>> => {
    try {
        const result = await prisma.userXP.updateMany({
            where: { weeklyXP: { gt: 0 } },
            data: {
                weeklyXP: 0,
                weekStartsAt: new Date(),
            },
        });

        return {
            success: true,
            data: { resetCount: result.count },
        };
    } catch (error) {
        console.error('[resetWeeklyXP] Error:', error);
        return { success: false, error: 'Failed to reset weekly XP' };
    }
};

export const resetMonthlyXP = async (): Promise<IApiResponse<{ resetCount: number }>> => {
    try {
        const result = await prisma.userXP.updateMany({
            where: { monthlyXP: { gt: 0 } },
            data: {
                monthlyXP: 0,
                monthStartsAt: new Date(),
            },
        });

        return {
            success: true,
            data: { resetCount: result.count },
        };
    } catch (error) {
        console.error('[resetMonthlyXP] Error:', error);
        return { success: false, error: 'Failed to reset monthly XP' };
    }
};

// =============================================
// Award XP for Specific Actions (Convenience)
// =============================================

export const awardXPForContentRead = async (contentId: string): Promise<IApiResponse<{ xpAwarded: number }>> => {
    const result = await awardXP('READ_CONTENT', contentId, 'Started reading content');
    if (result.success && result.data) {
        return { success: true, data: { xpAwarded: result.data.xpAwarded } };
    }
    return { success: false, error: result.error };
};

export const awardXPForContentComplete = async (contentId: string): Promise<IApiResponse<{ xpAwarded: number }>> => {
    const result = await awardXP('COMPLETE_CONTENT', contentId, 'Completed reading content');
    if (result.success && result.data) {
        return { success: true, data: { xpAwarded: result.data.xpAwarded } };
    }
    return { success: false, error: result.error };
};

export const awardXPForLessonComplete = async (lessonId: string): Promise<IApiResponse<{ xpAwarded: number }>> => {
    const result = await awardXP('COMPLETE_LESSON', lessonId, 'Completed a lesson');
    if (result.success && result.data) {
        return { success: true, data: { xpAwarded: result.data.xpAwarded } };
    }
    return { success: false, error: result.error };
};

export const awardXPForCourseComplete = async (courseId: string): Promise<IApiResponse<{ xpAwarded: number }>> => {
    const result = await awardXP('COMPLETE_COURSE', courseId, 'Completed a course');
    if (result.success && result.data) {
        return { success: true, data: { xpAwarded: result.data.xpAwarded } };
    }
    return { success: false, error: result.error };
};

export const awardXPForProblemSolved = async (
    problemId: string,
    difficulty: 'EASY' | 'MEDIUM' | 'HARD',
): Promise<IApiResponse<{ xpAwarded: number }>> => {
    const type = `SOLVE_PROBLEM_${difficulty}` as XPType;
    const result = await awardXP(type, problemId, `Solved a ${difficulty.toLowerCase()} problem`);
    if (result.success && result.data) {
        return { success: true, data: { xpAwarded: result.data.xpAwarded } };
    }
    return { success: false, error: result.error };
};

export const awardXPForComment = async (commentId: string): Promise<IApiResponse<{ xpAwarded: number }>> => {
    const result = await awardXP('COMMENT', commentId, 'Posted a comment');
    if (result.success && result.data) {
        return { success: true, data: { xpAwarded: result.data.xpAwarded } };
    }
    return { success: false, error: result.error };
};

export const awardXPForLike = async (contentId: string): Promise<IApiResponse<{ xpAwarded: number }>> => {
    const result = await awardXP('LIKE_CONTENT', contentId, 'Liked content');
    if (result.success && result.data) {
        return { success: true, data: { xpAwarded: result.data.xpAwarded } };
    }
    return { success: false, error: result.error };
};

// =============================================
// Get Daily Progress
// =============================================

export const getDailyProgress = async (): Promise<
    IApiResponse<{
        date: Date;
        xpEarned: number;
        contentCompleted: number;
        timeSpent: number;
        lessonsCompleted: number;
        problemsSolved: number;
        goalMet: boolean;
        dailyGoal: {
            xpGoal: number;
            contentGoal: number;
            timeGoal: number;
        };
    }>
> => {
    try {
        const user = await getCurrentUser(STAKEHOLDER.USER);
        if (!user) {
            return { success: false, error: 'Unauthorized' };
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [progress, goal] = await Promise.all([
            prisma.userDailyProgress.findUnique({
                where: {
                    userId_date: {
                        userId: user.userId,
                        date: today,
                    },
                },
            }),
            prisma.userDailyGoal.findUnique({
                where: { userId: user.userId },
            }),
        ]);

        const dailyGoal = {
            xpGoal: goal?.dailyXPGoal ?? 50,
            contentGoal: goal?.dailyContentGoal ?? 1,
            timeGoal: goal?.dailyTimeGoal ?? 30,
        };

        if (!progress) {
            return {
                success: true,
                data: {
                    date: today,
                    xpEarned: 0,
                    contentCompleted: 0,
                    timeSpent: 0,
                    lessonsCompleted: 0,
                    problemsSolved: 0,
                    goalMet: false,
                    dailyGoal,
                },
            };
        }

        const goalMet = progress.xpEarned >= dailyGoal.xpGoal;

        // Update goalMet status if needed
        if (goalMet && !progress.goalMet) {
            await prisma.userDailyProgress.update({
                where: { id: progress.id },
                data: { goalMet: true },
            });
        }

        return {
            success: true,
            data: {
                date: progress.date,
                xpEarned: progress.xpEarned,
                contentCompleted: progress.contentCompleted,
                timeSpent: progress.timeSpent,
                lessonsCompleted: progress.lessonsCompleted,
                problemsSolved: progress.problemsSolved,
                goalMet,
                dailyGoal,
            },
        };
    } catch (error) {
        console.error('[getDailyProgress] Error:', error);
        return { success: false, error: 'Failed to fetch daily progress' };
    }
};

// =============================================
// Update Daily Goal
// =============================================

export const updateDailyGoal = async (data: {
    dailyXPGoal?: number;
    dailyContentGoal?: number;
    dailyTimeGoal?: number;
    reminderEnabled?: boolean;
    reminderTime?: string;
}): Promise<IApiResponse<{ success: boolean }>> => {
    try {
        const user = await getCurrentUser(STAKEHOLDER.USER);
        if (!user) {
            return { success: false, error: 'Unauthorized' };
        }

        await prisma.userDailyGoal.upsert({
            where: { userId: user.userId },
            create: {
                userId: user.userId,
                ...data,
            },
            update: data,
        });

        return { success: true, data: { success: true } };
    } catch (error) {
        console.error('[updateDailyGoal] Error:', error);
        return { success: false, error: 'Failed to update daily goal' };
    }
};

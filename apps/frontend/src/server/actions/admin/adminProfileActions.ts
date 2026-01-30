'use server';

// =============================================
// Admin Profile Actions - Profile CRUD and Settings
// =============================================

import { STAKEHOLDER } from '@/constants/auth.constants';
import { getCurrentUser } from '@/lib/auth';
import { invalidateUserCache } from '@/lib/auth-cache';
import { type IApiResponse } from '@/lib/interfaces';
import { prisma } from '@/server/db/prisma';

// =============================================
// Type Definitions
// =============================================

export interface IAdminProfile {
    id: string;
    email: string;
    fullName: string;
    avatarLink: string | null;
    bio: string | null;
    isActive: boolean;
    createdAt: Date;
    invitedBy: {
        id: string;
        fullName: string;
    } | null;
    stats: {
        contentsCreated: number;
        seriesCreated: number;
        coursesCreated: number;
        quizzesCreated: number;
        practicesCreated: number;
        followersCount: number;
        totalContentViews: number;
    };
}

export interface IUpdateAdminProfileInput {
    fullName?: string;
    avatarLink?: string;
    bio?: string;
}

export interface IChangePasswordInput {
    currentPassword: string;
    newPassword: string;
}

// =============================================
// Get Admin Profile
// =============================================

export const getAdminProfile = async (): Promise<IApiResponse<IAdminProfile | null>> => {
    try {
        const currentUser = await getCurrentUser(STAKEHOLDER.ADMIN);
        if (!currentUser) {
            return {
                success: false,
                error: 'Unauthorized - Please log in',
                data: null,
            };
        }

        // Fetch admin with stats in parallel
        const [admin, stats] = await Promise.all([
            prisma.admin.findUnique({
                where: { id: currentUser.userId },
                select: {
                    id: true,
                    email: true,
                    fullName: true,
                    avatarLink: true,
                    bio: true,
                    isActive: true,
                    createdAt: true,
                    invitedBy: {
                        select: {
                            id: true,
                            fullName: true,
                        },
                    },
                },
            }),
            Promise.all([
                prisma.content.count({ where: { creatorId: currentUser.userId } }),
                prisma.series.count({ where: { creatorId: currentUser.userId } }),
                prisma.course.count({ where: { creatorId: currentUser.userId } }),
                prisma.quiz.count({ where: { creatorId: currentUser.userId } }),
                prisma.practice.count({ where: { creatorId: currentUser.userId } }),
                prisma.creatorFollower.count({ where: { creatorId: currentUser.userId } }),
                prisma.contentView.count({
                    where: {
                        content: { creatorId: currentUser.userId },
                    },
                }),
            ]),
        ]);

        if (!admin) {
            return {
                success: false,
                error: 'Admin not found',
                data: null,
            };
        }

        const [
            contentsCreated,
            seriesCreated,
            coursesCreated,
            quizzesCreated,
            practicesCreated,
            followersCount,
            totalContentViews,
        ] = stats;

        return {
            success: true,
            data: {
                ...admin,
                stats: {
                    contentsCreated,
                    seriesCreated,
                    coursesCreated,
                    quizzesCreated,
                    practicesCreated,
                    followersCount,
                    totalContentViews,
                },
            },
        };
    } catch (error) {
        console.error('[getAdminProfile] Error:', error);
        return {
            success: false,
            error: 'Failed to fetch profile',
            data: null,
        };
    }
};

// =============================================
// Update Admin Profile
// =============================================

export const updateAdminProfile = async (
    input: IUpdateAdminProfileInput,
): Promise<IApiResponse<{ id: string }>> => {
    try {
        const currentUser = await getCurrentUser(STAKEHOLDER.ADMIN);
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

        if (input.bio !== undefined && input.bio.trim().length > 500) {
            return {
                success: false,
                error: 'Bio must be 500 characters or less',
            };
        }

        // Update admin
        await prisma.admin.update({
            where: { id: currentUser.userId },
            data: {
                ...(input.fullName && { fullName: input.fullName.trim() }),
                ...(input.avatarLink !== undefined && { avatarLink: input.avatarLink.trim() || null }),
                ...(input.bio !== undefined && { bio: input.bio.trim() || null }),
            },
        });

        // Invalidate cached admin data
        void invalidateUserCache('ADMIN', currentUser.userId);

        return {
            success: true,
            data: { id: currentUser.userId },
            message: 'Profile updated successfully',
        };
    } catch (error) {
        console.error('[updateAdminProfile] Error:', error);
        return {
            success: false,
            error: 'Failed to update profile',
        };
    }
};

// =============================================
// Get Admin Content Stats
// =============================================

export const getAdminContentStats = async (): Promise<IApiResponse<{
    recentContents: Array<{
        id: string;
        title: string;
        slug: string;
        type: string;
        status: string;
        viewCount: number;
        createdAt: Date;
    }>;
    contentByType: Array<{ type: string; count: number }>;
    contentByStatus: Array<{ status: string; count: number }>;
    totalViews: number;
    totalLikes: number;
    totalComments: number;
}>> => {
    try {
        const currentUser = await getCurrentUser(STAKEHOLDER.ADMIN);
        if (!currentUser) {
            return {
                success: false,
                error: 'Unauthorized',
            };
        }

        const [recentContents, contentStats, engagementStats] = await Promise.all([
            // Recent contents
            prisma.content.findMany({
                where: { creatorId: currentUser.userId },
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    type: true,
                    status: true,
                    viewCount: true,
                    createdAt: true,
                },
                orderBy: { createdAt: 'desc' },
                take: 5,
            }),
            // Content groupings
            Promise.all([
                prisma.content.groupBy({
                    by: ['type'],
                    where: { creatorId: currentUser.userId },
                    _count: { id: true },
                }),
                prisma.content.groupBy({
                    by: ['status'],
                    where: { creatorId: currentUser.userId },
                    _count: { id: true },
                }),
            ]),
            // Engagement stats
            Promise.all([
                prisma.contentView.count({
                    where: { content: { creatorId: currentUser.userId } },
                }),
                prisma.contentLike.count({
                    where: { content: { creatorId: currentUser.userId } },
                }),
                prisma.comment.count({
                    where: { content: { creatorId: currentUser.userId } },
                }),
            ]),
        ]);

        const [contentByType, contentByStatus] = contentStats;
        const [totalViews, totalLikes, totalComments] = engagementStats;

        return {
            success: true,
            data: {
                recentContents,
                contentByType: (contentByType as Array<{ type: string; _count: { id: number } }>).map((c) => ({ type: c.type, count: c._count.id })),
                contentByStatus: (contentByStatus as Array<{ status: string; _count: { id: number } }>).map((c) => ({ status: c.status, count: c._count.id })),
                totalViews,
                totalLikes,
                totalComments,
            },
        };
    } catch (error) {
        console.error('[getAdminContentStats] Error:', error);
        return {
            success: false,
            error: 'Failed to fetch content stats',
        };
    }
};

// =============================================
// Get Admin Course Stats
// =============================================

export const getAdminCourseStats = async (): Promise<IApiResponse<{
    courses: Array<{
        id: string;
        title: string;
        slug: string;
        status: string;
        enrollmentCount: number;
        completionRate: number;
        createdAt: Date;
    }>;
    totalEnrollments: number;
    totalCompletions: number;
}>> => {
    try {
        const currentUser = await getCurrentUser(STAKEHOLDER.ADMIN);
        if (!currentUser) {
            return {
                success: false,
                error: 'Unauthorized',
            };
        }

        const coursesRaw = await prisma.course.findMany({
            where: { creatorId: currentUser.userId },
            select: {
                id: true,
                title: true,
                slug: true,
                status: true,
                createdAt: true,
                _count: {
                    select: {
                        enrollments: true,
                    },
                },
                enrollments: {
                    where: { completedAt: { not: null } },
                    select: { id: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        // Type assertion for Prisma include
        interface CourseWithStats {
            id: string;
            title: string;
            slug: string;
            status: string;
            createdAt: Date;
            _count: { enrollments: number };
            enrollments: Array<{ id: string }>;
        }
        const courses = coursesRaw as unknown as Array<CourseWithStats>;

        const coursesWithStats = courses.map((course) => {
            const enrollmentCount = course._count.enrollments;
            const completionCount = course.enrollments.length;
            const completionRate = enrollmentCount > 0
                ? Math.round((completionCount / enrollmentCount) * 100)
                : 0;

            return {
                id: course.id,
                title: course.title,
                slug: course.slug,
                status: course.status,
                enrollmentCount,
                completionRate,
                createdAt: course.createdAt,
            };
        });

        const totalEnrollments = coursesWithStats.reduce((sum, c) => sum + c.enrollmentCount, 0);
        const totalCompletions = courses.reduce((sum, c) => sum + c.enrollments.length, 0);

        return {
            success: true,
            data: {
                courses: coursesWithStats,
                totalEnrollments,
                totalCompletions,
            },
        };
    } catch (error) {
        console.error('[getAdminCourseStats] Error:', error);
        return {
            success: false,
            error: 'Failed to fetch course stats',
        };
    }
};

// =============================================
// Change Admin Password
// =============================================

export const changeAdminPassword = async (
    input: IChangePasswordInput,
): Promise<IApiResponse<{ success: boolean }>> => {
    try {
        const currentUser = await getCurrentUser(STAKEHOLDER.ADMIN);
        if (!currentUser) {
            return {
                success: false,
                error: 'Unauthorized',
            };
        }

        // Validate input
        if (!input.currentPassword || !input.newPassword) {
            return {
                success: false,
                error: 'Both current and new password are required',
            };
        }

        if (input.newPassword.length < 8) {
            return {
                success: false,
                error: 'New password must be at least 8 characters',
            };
        }

        // Fetch current admin with password
        const admin = await prisma.admin.findUnique({
            where: { id: currentUser.userId },
            select: { password: true },
        });

        if (!admin) {
            return {
                success: false,
                error: 'Admin not found',
            };
        }

        // Import argon2 for password comparison
        const argon2 = await import('argon2');

        // Verify current password
        const isValid = await argon2.verify(admin.password, input.currentPassword);
        if (!isValid) {
            return {
                success: false,
                error: 'Current password is incorrect',
            };
        }

        // Hash new password
        const hashedPassword = await argon2.hash(input.newPassword);

        // Update password
        await prisma.admin.update({
            where: { id: currentUser.userId },
            data: { password: hashedPassword },
        });

        return {
            success: true,
            data: { success: true },
            message: 'Password changed successfully',
        };
    } catch (error) {
        console.error('[changeAdminPassword] Error:', error);
        return {
            success: false,
            error: 'Failed to change password',
        };
    }
};

// =============================================
// Deactivate Admin Account
// =============================================

export const deactivateAdminAccount = async (): Promise<IApiResponse<{ success: boolean }>> => {
    try {
        const currentUser = await getCurrentUser(STAKEHOLDER.ADMIN);
        if (!currentUser) {
            return {
                success: false,
                error: 'Unauthorized',
            };
        }

        // Deactivate instead of delete to preserve content
        await prisma.admin.update({
            where: { id: currentUser.userId },
            data: { isActive: false },
        });

        // Invalidate cache
        void invalidateUserCache('ADMIN', currentUser.userId);

        return {
            success: true,
            data: { success: true },
            message: 'Account deactivated successfully',
        };
    } catch (error) {
        console.error('[deactivateAdminAccount] Error:', error);
        return {
            success: false,
            error: 'Failed to deactivate account',
        };
    }
};

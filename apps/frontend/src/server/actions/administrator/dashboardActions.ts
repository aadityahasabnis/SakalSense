'use server';

// =============================================
// Administrator Dashboard Actions
// =============================================

import { STAKEHOLDER } from '@/constants/auth.constants';
import { getCurrentUser } from '@/lib/auth';
import { type IApiResponse } from '@/lib/interfaces';
import { prisma } from '@/server/db/prisma';

// =============================================
// Type Definitions
// =============================================

export interface IPlatformStats {
    users: {
        total: number;
        active: number;
        verified: number;
        newThisWeek: number;
    };
    admins: {
        total: number;
        active: number;
        pendingRequests: number;
    };
    content: {
        total: number;
        published: number;
        draft: number;
        totalViews: number;
    };
    courses: {
        total: number;
        published: number;
        totalEnrollments: number;
    };
    engagement: {
        totalLikes: number;
        totalComments: number;
        totalBookmarks: number;
    };
}

export interface IRecentActivity {
    type: 'user_joined' | 'content_published' | 'course_created' | 'admin_request';
    title: string;
    subtitle: string;
    timestamp: Date;
    id: string;
}

export interface IAdminRequest {
    id: string;
    email: string;
    fullName: string;
    reason: string | null;
    status: string;
    createdAt: Date;
}

// =============================================
// Get Platform Statistics
// =============================================

export const getPlatformStats = async (): Promise<IApiResponse<IPlatformStats>> => {
    try {
        const currentUser = await getCurrentUser(STAKEHOLDER.ADMINISTRATOR);
        if (!currentUser) {
            return {
                success: false,
                error: 'Unauthorized - Administrator access required',
            };
        }

        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        // Fetch all stats in parallel
        const [
            userStats,
            adminStats,
            contentStats,
            courseStats,
            engagementStats,
        ] = await Promise.all([
            // User stats
            Promise.all([
                prisma.user.count(),
                prisma.user.count({ where: { isActive: true } }),
                prisma.user.count({ where: { isVerified: true } }),
                prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
            ]),
            // Admin stats
            Promise.all([
                prisma.admin.count(),
                prisma.admin.count({ where: { isActive: true } }),
                prisma.adminInviteRequest.count({ where: { status: 'PENDING' } }),
            ]),
            // Content stats
            Promise.all([
                prisma.content.count(),
                prisma.content.count({ where: { status: 'PUBLISHED' } }),
                prisma.content.count({ where: { status: 'DRAFT' } }),
                prisma.content.aggregate({ _sum: { viewCount: true } }),
            ]),
            // Course stats
            Promise.all([
                prisma.course.count(),
                prisma.course.count({ where: { status: 'PUBLISHED' } }),
                prisma.courseEnrollment.count(),
            ]),
            // Engagement stats
            Promise.all([
                prisma.contentLike.count(),
                prisma.comment.count(),
                prisma.bookmark.count(),
            ]),
        ]);

        return {
            success: true,
            data: {
                users: {
                    total: userStats[0],
                    active: userStats[1],
                    verified: userStats[2],
                    newThisWeek: userStats[3],
                },
                admins: {
                    total: adminStats[0],
                    active: adminStats[1],
                    pendingRequests: adminStats[2],
                },
                content: {
                    total: contentStats[0],
                    published: contentStats[1],
                    draft: contentStats[2],
                    totalViews: contentStats[3]._sum.viewCount ?? 0,
                },
                courses: {
                    total: courseStats[0],
                    published: courseStats[1],
                    totalEnrollments: courseStats[2],
                },
                engagement: {
                    totalLikes: engagementStats[0],
                    totalComments: engagementStats[1],
                    totalBookmarks: engagementStats[2],
                },
            },
        };
    } catch (error) {
        console.error('[getPlatformStats] Error:', error);
        return {
            success: false,
            error: 'Failed to fetch platform statistics',
        };
    }
};

// =============================================
// Get Recent Platform Activity
// =============================================

export const getRecentActivity = async (limit = 10): Promise<IApiResponse<Array<IRecentActivity>>> => {
    try {
        const currentUser = await getCurrentUser(STAKEHOLDER.ADMINISTRATOR);
        if (!currentUser) {
            return {
                success: false,
                error: 'Unauthorized',
            };
        }

        // Fetch recent activities in parallel
        const [recentUsers, recentContent, recentCourses, recentRequests] = await Promise.all([
            prisma.user.findMany({
                select: { id: true, fullName: true, email: true, createdAt: true },
                orderBy: { createdAt: 'desc' },
                take: 5,
            }),
            prisma.content.findMany({
                where: { status: 'PUBLISHED' },
                select: { id: true, title: true, type: true, publishedAt: true, creatorId: true },
                orderBy: { publishedAt: 'desc' },
                take: 5,
            }),
            prisma.course.findMany({
                select: { id: true, title: true, createdAt: true, creatorId: true },
                orderBy: { createdAt: 'desc' },
                take: 5,
            }),
            prisma.adminInviteRequest.findMany({
                where: { status: 'PENDING' },
                select: { id: true, fullName: true, email: true, createdAt: true },
                orderBy: { createdAt: 'desc' },
                take: 5,
            }),
        ]);

        // Combine and sort all activities
        const activities: Array<IRecentActivity> = [
            ...recentUsers.map((u: { id: string; fullName: string; email: string; createdAt: Date }) => ({
                type: 'user_joined' as const,
                title: u.fullName,
                subtitle: `New user joined: ${u.email}`,
                timestamp: u.createdAt,
                id: u.id,
            })),
            ...recentContent.map((c: { id: string; title: string; type: string; publishedAt: Date | null }) => ({
                type: 'content_published' as const,
                title: c.title,
                subtitle: `${c.type} published`,
                timestamp: c.publishedAt ?? new Date(),
                id: c.id,
            })),
            ...recentCourses.map((c: { id: string; title: string; createdAt: Date }) => ({
                type: 'course_created' as const,
                title: c.title,
                subtitle: `Course created`,
                timestamp: c.createdAt,
                id: c.id,
            })),
            ...recentRequests.map((r: { id: string; fullName: string; email: string; createdAt: Date }) => ({
                type: 'admin_request' as const,
                title: r.fullName,
                subtitle: `Admin access request: ${r.email}`,
                timestamp: r.createdAt,
                id: r.id,
            })),
        ];

        // Sort by timestamp descending
        activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

        return {
            success: true,
            data: activities.slice(0, limit),
        };
    } catch (error) {
        console.error('[getRecentActivity] Error:', error);
        return {
            success: false,
            error: 'Failed to fetch recent activity',
        };
    }
};

// =============================================
// Get Pending Admin Requests
// =============================================

export const getPendingAdminRequests = async (): Promise<IApiResponse<Array<IAdminRequest>>> => {
    try {
        const currentUser = await getCurrentUser(STAKEHOLDER.ADMINISTRATOR);
        if (!currentUser) {
            return {
                success: false,
                error: 'Unauthorized',
            };
        }

        const requests = await prisma.adminInviteRequest.findMany({
            where: { status: 'PENDING' },
            orderBy: { createdAt: 'desc' },
            take: 10,
        });

        return {
            success: true,
            data: requests,
        };
    } catch (error) {
        console.error('[getPendingAdminRequests] Error:', error);
        return {
            success: false,
            error: 'Failed to fetch admin requests',
        };
    }
};

// =============================================
// Approve Admin Request
// =============================================

export const approveAdminRequest = async (requestId: string): Promise<IApiResponse<{ adminId: string }>> => {
    try {
        const currentUser = await getCurrentUser(STAKEHOLDER.ADMINISTRATOR);
        if (!currentUser) {
            return {
                success: false,
                error: 'Unauthorized',
            };
        }

        // Get the request
        const request = await prisma.adminInviteRequest.findUnique({
            where: { id: requestId },
        });

        if (!request) {
            return {
                success: false,
                error: 'Request not found',
            };
        }

        if (request.status !== 'PENDING') {
            return {
                success: false,
                error: 'Request has already been processed',
            };
        }

        // Import argon2 for password hashing
        const argon2 = await import('argon2');

        // Create temporary password
        const tempPassword = crypto.randomUUID().slice(0, 12);
        const hashedPassword = await argon2.hash(tempPassword);

        // Create admin and update request in transaction
        const result = await prisma.$transaction(async (tx) => {
            // Create admin account
            const admin = await tx.admin.create({
                data: {
                    email: request.email,
                    fullName: request.fullName,
                    password: hashedPassword,
                    invitedById: currentUser.userId,
                },
            });

            // Update request status
            await tx.adminInviteRequest.update({
                where: { id: requestId },
                data: { status: 'APPROVED' },
            });

            return admin;
        });

        // TODO: Send email with temporary password

        return {
            success: true,
            data: { adminId: result.id },
            message: `Admin account created for ${request.email}. Temporary password: ${tempPassword}`,
        };
    } catch (error) {
        console.error('[approveAdminRequest] Error:', error);
        return {
            success: false,
            error: 'Failed to approve request',
        };
    }
};

// =============================================
// Reject Admin Request
// =============================================

export const rejectAdminRequest = async (requestId: string, reason?: string): Promise<IApiResponse<{ success: boolean }>> => {
    try {
        const currentUser = await getCurrentUser(STAKEHOLDER.ADMINISTRATOR);
        if (!currentUser) {
            return {
                success: false,
                error: 'Unauthorized',
            };
        }

        await prisma.adminInviteRequest.update({
            where: { id: requestId },
            data: { status: 'REJECTED' },
        });

        // TODO: Send rejection email with reason

        return {
            success: true,
            data: { success: true },
            message: 'Request rejected',
        };
    } catch (error) {
        console.error('[rejectAdminRequest] Error:', error);
        return {
            success: false,
            error: 'Failed to reject request',
        };
    }
};

// =============================================
// Get Top Creators (by content views)
// =============================================

export const getTopCreators = async (limit = 5): Promise<IApiResponse<Array<{
    id: string;
    fullName: string;
    avatarLink: string | null;
    contentCount: number;
    totalViews: number;
}>>> => {
    try {
        const currentUser = await getCurrentUser(STAKEHOLDER.ADMINISTRATOR);
        if (!currentUser) {
            return {
                success: false,
                error: 'Unauthorized',
            };
        }

        const creators = await prisma.admin.findMany({
            where: { isActive: true },
            select: {
                id: true,
                fullName: true,
                avatarLink: true,
                _count: {
                    select: { contents: true },
                },
                contents: {
                    select: { viewCount: true },
                },
            },
            take: 20, // Get more to filter by views
        });

        const creatorsWithStats = creators
            .map((c: { id: string; fullName: string; avatarLink: string | null; _count: { contents: number }; contents: Array<{ viewCount: number }> }) => ({
                id: c.id,
                fullName: c.fullName,
                avatarLink: c.avatarLink,
                contentCount: c._count.contents,
                totalViews: c.contents.reduce((sum: number, content: { viewCount: number }) => sum + content.viewCount, 0),
            }))
            .sort((a: { totalViews: number }, b: { totalViews: number }) => b.totalViews - a.totalViews)
            .slice(0, limit);

        return {
            success: true,
            data: creatorsWithStats,
        };
    } catch (error) {
        console.error('[getTopCreators] Error:', error);
        return {
            success: false,
            error: 'Failed to fetch top creators',
        };
    }
};

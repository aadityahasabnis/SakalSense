'use server';
// =============================================
// Public Course Actions - For end users to browse and enroll in courses
// =============================================

import { type DifficultyType } from '@/constants/content.constants';
import { prisma } from '@/server/db/prisma';
import { type ICourse } from '@/types/content.types';

// =============================================
// Response Types
// =============================================

interface IPublicCourseListResponse {
    success: boolean;
    data?: Array<ICourse>;
    total?: number;
    error?: string;
}

interface IPublicCourseResponse {
    success: boolean;
    data?: ICourse & {
        sections: Array<{
            id: string;
            title: string;
            description?: string;
            order: number;
            lessons: Array<{
                id: string;
                title: string;
                description?: string;
                order: number;
                isFree: boolean;
            }>;
        }>;
    };
    error?: string;
}

// =============================================
// Get Published Courses List (Public)
// =============================================

export const getPublicCourseList = async (filters: {
    search?: string;
    difficulty?: DifficultyType;
    page?: number;
    limit?: number;
}): Promise<IPublicCourseListResponse> => {
    try {
        const { search = '', difficulty, page = 1, limit = 20 } = filters;

        const where: Record<string, unknown> = {
            status: 'PUBLISHED',
            isPublished: true,
            ...(search && {
                OR: [
                    { title: { contains: search, mode: 'insensitive' as const } },
                    { slug: { contains: search, mode: 'insensitive' as const } },
                    { description: { contains: search, mode: 'insensitive' as const } },
                ],
            }),
            ...(difficulty && { difficulty }),
        };

        const [data, total] = await Promise.all([
            prisma.course.findMany({
                where,
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    description: true,
                    thumbnailUrl: true,
                    difficulty: true,
                    estimatedHours: true,
                    status: true,
                    isPublished: true,
                    isFeatured: true,
                    publishedAt: true,
                    createdAt: true,
                    creator: {
                        select: {
                            fullName: true,
                            avatarLink: true,
                        },
                    },
                    _count: {
                        select: {
                            sections: true,
                            enrollments: true,
                        },
                    },
                },
                orderBy: { publishedAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.course.count({ where }),
        ]);

        return {
            success: true,
            data: data as unknown as Array<ICourse>,
            total,
        };
    } catch (error) {
        console.error('getPublicCourseList error:', error);
        return { success: false, error: 'Failed to fetch courses' };
    }
};

// =============================================
// Get Course By Slug (Public)
// =============================================

export const getCourseBySlug = async (slug: string, userId?: string): Promise<IPublicCourseResponse> => {
    try {
        const course = await prisma.course.findFirst({
            where: {
                slug,
                status: 'PUBLISHED',
                isPublished: true,
            },
            include: {
                sections: {
                    orderBy: { order: 'asc' },
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        order: true,
                        lessons: {
                            orderBy: { order: 'asc' },
                            select: {
                                id: true,
                                title: true,
                                description: true,
                                order: true,
                                isFree: true,
                            },
                        },
                    },
                },
                creator: {
                    select: {
                        id: true,
                        fullName: true,
                        avatarLink: true,
                    },
                },
                _count: {
                    select: {
                        enrollments: true,
                    },
                },
            },
        });

        if (!course) {
            return { success: false, error: 'Course not found' };
        }

        return {
            success: true,
            data: course as unknown as IPublicCourseResponse['data'],
        };
    } catch (error) {
        console.error('getCourseBySlug error:', error);
        return { success: false, error: 'Failed to fetch course' };
    }
};

// =============================================
// Get Featured Courses
// =============================================

export const getFeaturedCourses = async (limit = 5): Promise<IPublicCourseListResponse> => {
    try {
        const data = await prisma.course.findMany({
            where: {
                status: 'PUBLISHED',
                isPublished: true,
                isFeatured: true,
            },
            select: {
                id: true,
                title: true,
                slug: true,
                description: true,
                thumbnailUrl: true,
                difficulty: true,
                estimatedHours: true,
                publishedAt: true,
                creator: {
                    select: {
                        fullName: true,
                        avatarLink: true,
                    },
                },
                _count: {
                    select: {
                        sections: true,
                        enrollments: true,
                    },
                },
            },
            orderBy: { publishedAt: 'desc' },
            take: limit,
        });

        return {
            success: true,
            data: data as unknown as Array<ICourse>,
            total: data.length,
        };
    } catch (error) {
        console.error('getFeaturedCourses error:', error);
        return { success: false, error: 'Failed to fetch featured courses' };
    }
};

// =============================================
// Check if User is Enrolled
// =============================================

export const checkEnrollmentStatus = async (
    courseId: string,
    userId: string
): Promise<{ success: boolean; isEnrolled: boolean; error?: string }> => {
    try {
        const enrollment = await prisma.courseEnrollment.findUnique({
            where: {
                userId_courseId: {
                    userId,
                    courseId,
                },
            },
        });

        return {
            success: true,
            isEnrolled: !!enrollment,
        };
    } catch (error) {
        console.error('checkEnrollmentStatus error:', error);
        return { success: false, isEnrolled: false, error: 'Failed to check enrollment status' };
    }
};

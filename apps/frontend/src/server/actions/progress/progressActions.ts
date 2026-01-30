'use server';

// =============================================
// Progress Actions - Track user learning progress
// =============================================

import { STAKEHOLDER } from '@/constants/auth.constants';
import { getCurrentUser } from '@/lib/auth';
import { type IApiResponse } from '@/lib/interfaces';
import { prisma } from '@/server/db/prisma';

// =============================================
// Types
// =============================================

interface IContentProgress {
    id: string;
    contentId: string;
    progress: number;
    lastPosition?: number;
    timeSpent: number;
    completedAt: Date | null;
}

interface ICourseProgress {
    id: string;
    courseId: string;
    progress: number;
    currentLessonId?: string;
    completedAt: Date | null;
}

// =============================================
// Update Content Progress
// =============================================

export const updateContentProgress = async (
    contentId: string,
    data: {
        progress: number;
        lastPosition?: number;
        timeSpent?: number;
    },
): Promise<IApiResponse<IContentProgress>> => {
    try {
        const user = await getCurrentUser(STAKEHOLDER.USER);
        if (!user) {
            return { success: false, error: 'Unauthorized' };
        }

        const { progress, lastPosition, timeSpent = 0 } = data;

        // Upsert progress
        const result = await prisma.contentProgress.upsert({
            where: {
                userId_contentId: {
                    userId: user.userId,
                    contentId,
                },
            },
            create: {
                userId: user.userId,
                contentId,
                progress,
                lastPosition,
                timeSpent,
                lastViewedAt: new Date(),
                startedAt: new Date(),
                completedAt: progress >= 100 ? new Date() : null,
            },
            update: {
                progress,
                lastPosition,
                timeSpent: { increment: timeSpent },
                lastViewedAt: new Date(),
                completedAt: progress >= 100 ? new Date() : undefined,
            },
        });

        // Update streak if progress made
        if (progress > 0) {
            await updateUserStreak(user.userId);
        }

        return {
            success: true,
            data: {
                id: result.id,
                contentId: result.contentId,
                progress: result.progress,
                lastPosition: result.lastPosition ?? undefined,
                timeSpent: result.timeSpent,
                completedAt: result.completedAt,
            },
        };
    } catch (error) {
        console.error('[updateContentProgress] Error:', error);
        return { success: false, error: 'Failed to update progress' };
    }
};

// =============================================
// Get Content Progress
// =============================================

export const getContentProgress = async (
    contentId: string,
): Promise<IApiResponse<IContentProgress | null>> => {
    try {
        const user = await getCurrentUser(STAKEHOLDER.USER);
        if (!user) {
            return { success: false, error: 'Unauthorized' };
        }

        const progress = await prisma.contentProgress.findUnique({
            where: {
                userId_contentId: {
                    userId: user.userId,
                    contentId,
                },
            },
        });

        if (!progress) {
            return { success: true, data: null };
        }

        return {
            success: true,
            data: {
                id: progress.id,
                contentId: progress.contentId,
                progress: progress.progress,
                lastPosition: progress.lastPosition ?? undefined,
                timeSpent: progress.timeSpent,
                completedAt: progress.completedAt,
            },
        };
    } catch (error) {
        console.error('[getContentProgress] Error:', error);
        return { success: false, error: 'Failed to fetch progress' };
    }
};

// =============================================
// Enroll in Course
// =============================================

export const enrollInCourse = async (
    courseId: string,
): Promise<IApiResponse<{ enrollmentId: string }>> => {
    try {
        const user = await getCurrentUser(STAKEHOLDER.USER);
        if (!user) {
            return { success: false, error: 'Unauthorized' };
        }

        // Check if already enrolled
        const existing = await prisma.courseEnrollment.findUnique({
            where: {
                userId_courseId: {
                    userId: user.userId,
                    courseId,
                },
            },
        });

        if (existing) {
            return { success: true, data: { enrollmentId: existing.id } };
        }

        // Get first lesson
        const courseWithSections = await prisma.course.findUnique({
            where: { id: courseId },
            include: {
                sections: {
                    orderBy: { order: 'asc' },
                    take: 1,
                    include: {
                        lessons: {
                            orderBy: { order: 'asc' },
                            take: 1,
                        },
                    },
                },
            },
        }) as { sections: Array<{ lessons: Array<{ id: string }> }> } | null;

        if (!courseWithSections) {
            return { success: false, error: 'Course not found' };
        }

        const firstLesson = courseWithSections.sections[0]?.lessons[0];

        // Create enrollment
        const enrollment = await prisma.courseEnrollment.create({
            data: {
                userId: user.userId,
                courseId,
                progress: 0,
                currentLessonId: firstLesson?.id,
            },
        });

        return {
            success: true,
            data: { enrollmentId: enrollment.id },
            message: 'Successfully enrolled in course',
        };
    } catch (error) {
        console.error('[enrollInCourse] Error:', error);
        return { success: false, error: 'Failed to enroll in course' };
    }
};

// =============================================
// Mark Lesson Complete
// =============================================

export const markLessonComplete = async (
    courseId: string,
    lessonId: string,
): Promise<IApiResponse<ICourseProgress>> => {
    try {
        const user = await getCurrentUser(STAKEHOLDER.USER);
        if (!user) {
            return { success: false, error: 'Unauthorized' };
        }

        // Get enrollment
        const enrollment = await prisma.courseEnrollment.findUnique({
            where: {
                userId_courseId: {
                    userId: user.userId,
                    courseId,
                },
            },
        });

        if (!enrollment) {
            return { success: false, error: 'Not enrolled in this course' };
        }

        // Get total lessons count
        const course = await prisma.course.findUnique({
            where: { id: courseId },
            include: {
                sections: {
                    include: {
                        lessons: true,
                    },
                },
            },
        });

        if (!course) {
            return { success: false, error: 'Course not found' };
        }

        const totalLessons = course.sections.reduce((acc, s) => acc + s.lessons.length, 0);

        // Create or update lesson progress
        await prisma.lessonProgress.upsert({
            where: {
                userId_lessonId: {
                    userId: user.userId,
                    lessonId,
                },
            },
            create: {
                userId: user.userId,
                lessonId,
                completed: true,
                completedAt: new Date(),
            },
            update: {
                completed: true,
                completedAt: new Date(),
            },
        });

        // Count completed lessons for this course
        const allLessonIds = course.sections.flatMap(s => s.lessons.map(l => l.id));
        const completedLessons = await prisma.lessonProgress.count({
            where: {
                userId: user.userId,
                lessonId: { in: allLessonIds },
                completed: true,
            },
        });

        // Calculate progress
        const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
        const isCompleted = progress >= 100;

        // Find next lesson
        let nextLessonId: string | undefined;
        let foundCurrent = false;

        for (const section of course.sections) {
            for (const lesson of section.lessons) {
                if (foundCurrent) {
                    nextLessonId = lesson.id;
                    break;
                }
                if (lesson.id === lessonId) {
                    foundCurrent = true;
                }
            }
            if (nextLessonId) break;
        }

        // Update enrollment
        const updatedEnrollment = await prisma.courseEnrollment.update({
            where: { id: enrollment.id },
            data: {
                progress,
                currentLessonId: nextLessonId ?? lessonId,
                completedAt: isCompleted ? new Date() : undefined,
            },
        });

        // Update streak
        await updateUserStreak(user.userId);

        return {
            success: true,
            data: {
                id: updatedEnrollment.id,
                courseId: updatedEnrollment.courseId,
                progress: updatedEnrollment.progress,
                currentLessonId: updatedEnrollment.currentLessonId ?? undefined,
                completedAt: updatedEnrollment.completedAt,
            },
        };
    } catch (error) {
        console.error('[markLessonComplete] Error:', error);
        return { success: false, error: 'Failed to mark lesson complete' };
    }
};

// =============================================
// Get Course Progress
// =============================================

export const getCourseProgress = async (
    courseId: string,
): Promise<IApiResponse<ICourseProgress | null>> => {
    try {
        const user = await getCurrentUser(STAKEHOLDER.USER);
        if (!user) {
            return { success: false, error: 'Unauthorized' };
        }

        const enrollment = await prisma.courseEnrollment.findUnique({
            where: {
                userId_courseId: {
                    userId: user.userId,
                    courseId,
                },
            },
        });

        if (!enrollment) {
            return { success: true, data: null };
        }

        return {
            success: true,
            data: {
                id: enrollment.id,
                courseId: enrollment.courseId,
                progress: enrollment.progress,
                currentLessonId: enrollment.currentLessonId ?? undefined,
                completedAt: enrollment.completedAt,
            },
        };
    } catch (error) {
        console.error('[getCourseProgress] Error:', error);
        return { success: false, error: 'Failed to fetch course progress' };
    }
};

// =============================================
// Get All Course Enrollments
// =============================================

export const getUserEnrollments = async (): Promise<IApiResponse<{
    enrollments: Array<{
        id: string;
        courseId: string;
        progress: number;
        enrolledAt: Date;
        course: {
            id: string;
            title: string;
            slug: string;
            thumbnailUrl: string | null;
            difficulty: string;
        };
    }>;
}>> => {
    try {
        const user = await getCurrentUser(STAKEHOLDER.USER);
        if (!user) {
            return { success: false, error: 'Unauthorized' };
        }

        const enrollments = await prisma.courseEnrollment.findMany({
            where: { userId: user.userId },
            include: {
                course: {
                    select: {
                        id: true,
                        title: true,
                        slug: true,
                        thumbnailUrl: true,
                        difficulty: true,
                    },
                },
            },
            orderBy: { enrolledAt: 'desc' },
        }) as unknown as Array<{
            id: string;
            courseId: string;
            progress: number;
            enrolledAt: Date;
            course: {
                id: string;
                title: string;
                slug: string;
                thumbnailUrl: string | null;
                difficulty: string;
            };
        }>;

        return {
            success: true,
            data: {
                enrollments: enrollments.map((e) => ({
                    id: e.id,
                    courseId: e.courseId,
                    progress: e.progress,
                    enrolledAt: e.enrolledAt,
                    course: e.course,
                })),
            },
        };
    } catch (error) {
        console.error('[getUserEnrollments] Error:', error);
        return { success: false, error: 'Failed to fetch enrollments' };
    }
};

// =============================================
// Helper: Update User Streak
// =============================================

const updateUserStreak = async (userId: string): Promise<void> => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        // Get current streak
        const streak = await prisma.userStreak.findUnique({
            where: { userId },
        });

        if (!streak) {
            // Create new streak
            await prisma.userStreak.create({
                data: {
                    userId,
                    currentStreak: 1,
                    longestStreak: 1,
                    lastActiveAt: new Date(),
                },
            });
            return;
        }

        const lastActive = new Date(streak.lastActiveAt);
        lastActive.setHours(0, 0, 0, 0);

        if (lastActive.getTime() === today.getTime()) {
            // Already active today, no update needed
            return;
        }

        if (lastActive.getTime() === yesterday.getTime()) {
            // Continue streak
            const newStreak = streak.currentStreak + 1;
            await prisma.userStreak.update({
                where: { userId },
                data: {
                    currentStreak: newStreak,
                    longestStreak: Math.max(newStreak, streak.longestStreak),
                    lastActiveAt: new Date(),
                },
            });
        } else {
            // Streak broken, reset to 1
            await prisma.userStreak.update({
                where: { userId },
                data: {
                    currentStreak: 1,
                    lastActiveAt: new Date(),
                },
            });
        }
    } catch (error) {
        console.error('[updateUserStreak] Error:', error);
        // Non-critical, don't throw
    }
};

// =============================================
// Record Content View
// =============================================

export const recordContentView = async (
    contentId: string,
    data?: {
        referrer?: string;
        duration?: number;
    },
): Promise<IApiResponse<{ viewId: string }>> => {
    try {
        const user = await getCurrentUser(STAKEHOLDER.USER);

        // Create view record
        const view = await prisma.contentView.create({
            data: {
                contentId,
                userId: user?.userId,
                referrer: data?.referrer,
                duration: data?.duration,
            },
        });

        // Increment view count on content
        await prisma.content.update({
            where: { id: contentId },
            data: { viewCount: { increment: 1 } },
        });

        return {
            success: true,
            data: { viewId: view.id },
        };
    } catch (error) {
        console.error('[recordContentView] Error:', error);
        return { success: false, error: 'Failed to record view' };
    }
};

'use server';

// =============================================
// Lesson Actions - Fetch lesson data for learning
// =============================================

import { STAKEHOLDER } from '@/constants/auth.constants';
import { getCurrentUser } from '@/lib/auth';
import { type IApiResponse } from '@/lib/interfaces';
import { prisma } from '@/server/db/prisma';
import { awardXP, XP_VALUES } from '@/server/actions/gamification/xpActions';

// =============================================
// Types
// =============================================

export interface ILessonData {
    id: string;
    title: string;
    description?: string;
    body: unknown; // JSON content
    order: number;
    isFree: boolean;
    section: {
        id: string;
        title: string;
        order: number;
    };
    quiz?: {
        id: string;
        title: string;
    };
}

export interface ICourseNavigation {
    course: {
        id: string;
        title: string;
        slug: string;
    };
    sections: Array<{
        id: string;
        title: string;
        order: number;
        lessons: Array<{
            id: string;
            title: string;
            order: number;
            isFree: boolean;
            isCompleted: boolean;
        }>;
    }>;
    currentLesson: {
        id: string;
        sectionId: string;
    };
    previousLesson?: {
        id: string;
        title: string;
    };
    nextLesson?: {
        id: string;
        title: string;
    };
    progress: number;
    completedLessons: number;
    totalLessons: number;
}

// =============================================
// Get Lesson Data
// =============================================

export const getLessonData = async (
    courseSlug: string,
    lessonId: string,
): Promise<IApiResponse<ILessonData>> => {
    try {
        const user = await getCurrentUser(STAKEHOLDER.USER);

        // Get the lesson with its section and course info
        const lesson = await prisma.lesson.findUnique({
            where: { id: lessonId },
            include: {
                section: {
                    include: {
                        course: {
                            select: {
                                id: true,
                                slug: true,
                                status: true,
                                isPublished: true,
                            },
                        },
                    },
                },
                quiz: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
            },
        });

        if (!lesson) {
            return { success: false, error: 'Lesson not found' };
        }

        // Verify course slug matches
        if (lesson.section.course.slug !== courseSlug) {
            return { success: false, error: 'Lesson does not belong to this course' };
        }

        // Verify course is published
        if (lesson.section.course.status !== 'PUBLISHED' || !lesson.section.course.isPublished) {
            return { success: false, error: 'Course is not published' };
        }

        // Check access - either free lesson or enrolled user
        if (!lesson.isFree && user) {
            const enrollment = await prisma.courseEnrollment.findUnique({
                where: {
                    userId_courseId: {
                        userId: user.userId,
                        courseId: lesson.section.course.id,
                    },
                },
            });

            if (!enrollment) {
                return { success: false, error: 'You must be enrolled to access this lesson' };
            }
        } else if (!lesson.isFree && !user) {
            return { success: false, error: 'Login required to access this lesson' };
        }

        return {
            success: true,
            data: {
                id: lesson.id,
                title: lesson.title,
                description: lesson.description ?? undefined,
                body: lesson.body,
                order: lesson.order,
                isFree: lesson.isFree,
                section: {
                    id: lesson.section.id,
                    title: lesson.section.title,
                    order: lesson.section.order,
                },
                quiz: lesson.quiz ?? undefined,
            },
        };
    } catch (error) {
        console.error('[getLessonData] Error:', error);
        return { success: false, error: 'Failed to fetch lesson data' };
    }
};

// =============================================
// Get Course Navigation (for sidebar)
// =============================================

export const getCourseNavigation = async (
    courseSlug: string,
    currentLessonId: string,
): Promise<IApiResponse<ICourseNavigation>> => {
    try {
        const user = await getCurrentUser(STAKEHOLDER.USER);

        // Get course with all sections and lessons
        const course = await prisma.course.findFirst({
            where: {
                slug: courseSlug,
                status: 'PUBLISHED',
                isPublished: true,
            },
            include: {
                sections: {
                    orderBy: { order: 'asc' },
                    include: {
                        lessons: {
                            orderBy: { order: 'asc' },
                            select: {
                                id: true,
                                title: true,
                                order: true,
                                isFree: true,
                            },
                        },
                    },
                },
            },
        });

        if (!course) {
            return { success: false, error: 'Course not found' };
        }

        // Get completed lessons for this user
        let completedLessonIds: string[] = [];
        let enrollmentProgress = 0;

        if (user) {
            const allLessonIds = course.sections.flatMap(s => s.lessons.map(l => l.id));
            const completedLessons = await prisma.lessonProgress.findMany({
                where: {
                    userId: user.userId,
                    lessonId: { in: allLessonIds },
                    completed: true,
                },
                select: { lessonId: true },
            });
            completedLessonIds = completedLessons.map(cl => cl.lessonId);

            // Get enrollment progress
            const enrollment = await prisma.courseEnrollment.findUnique({
                where: {
                    userId_courseId: {
                        userId: user.userId,
                        courseId: course.id,
                    },
                },
            });
            enrollmentProgress = enrollment?.progress ?? 0;
        }

        // Build sections with completion status
        const sectionsWithProgress = course.sections.map(section => ({
            id: section.id,
            title: section.title,
            order: section.order,
            lessons: section.lessons.map(lesson => ({
                id: lesson.id,
                title: lesson.title,
                order: lesson.order,
                isFree: lesson.isFree,
                isCompleted: completedLessonIds.includes(lesson.id),
            })),
        }));

        // Find current lesson position for navigation
        let currentSection: { id: string; title: string; order: number } | undefined;
        let previousLesson: { id: string; title: string } | undefined;
        let nextLesson: { id: string; title: string } | undefined;

        // Flatten all lessons to find prev/next
        const allLessons: Array<{ id: string; title: string; sectionId: string }> = [];
        for (const section of course.sections) {
            for (const lesson of section.lessons) {
                allLessons.push({
                    id: lesson.id,
                    title: lesson.title,
                    sectionId: section.id,
                });
            }
        }

        const currentIndex = allLessons.findIndex(l => l.id === currentLessonId);
        if (currentIndex > 0) {
            previousLesson = {
                id: allLessons[currentIndex - 1].id,
                title: allLessons[currentIndex - 1].title,
            };
        }
        if (currentIndex < allLessons.length - 1) {
            nextLesson = {
                id: allLessons[currentIndex + 1].id,
                title: allLessons[currentIndex + 1].title,
            };
        }

        // Find current section
        const currentLessonSection = allLessons[currentIndex];
        if (currentLessonSection) {
            const section = course.sections.find(s => s.id === currentLessonSection.sectionId);
            if (section) {
                currentSection = {
                    id: section.id,
                    title: section.title,
                    order: section.order,
                };
            }
        }

        const totalLessons = allLessons.length;

        return {
            success: true,
            data: {
                course: {
                    id: course.id,
                    title: course.title,
                    slug: course.slug,
                },
                sections: sectionsWithProgress,
                currentLesson: {
                    id: currentLessonId,
                    sectionId: currentSection?.id ?? '',
                },
                previousLesson,
                nextLesson,
                progress: enrollmentProgress,
                completedLessons: completedLessonIds.length,
                totalLessons,
            },
        };
    } catch (error) {
        console.error('[getCourseNavigation] Error:', error);
        return { success: false, error: 'Failed to fetch course navigation' };
    }
};

// =============================================
// Mark Lesson Complete with XP Award
// =============================================

export const completeLessonWithXP = async (
    courseId: string,
    lessonId: string,
): Promise<IApiResponse<{
    progress: number;
    xpAwarded: number;
    levelUp: boolean;
    sectionCompleted: boolean;
    courseCompleted: boolean;
}>> => {
    try {
        const user = await getCurrentUser(STAKEHOLDER.USER);
        if (!user) {
            return { success: false, error: 'Unauthorized' };
        }

        // Check if already completed
        const existingProgress = await prisma.lessonProgress.findUnique({
            where: {
                userId_lessonId: {
                    userId: user.userId,
                    lessonId,
                },
            },
        });

        if (existingProgress?.completed) {
            // Already completed, just return current state
            const enrollment = await prisma.courseEnrollment.findUnique({
                where: {
                    userId_courseId: {
                        userId: user.userId,
                        courseId,
                    },
                },
            });

            return {
                success: true,
                data: {
                    progress: enrollment?.progress ?? 0,
                    xpAwarded: 0,
                    levelUp: false,
                    sectionCompleted: false,
                    courseCompleted: false,
                },
                message: 'Lesson already completed',
            };
        }

        // Get lesson with section info
        const lesson = await prisma.lesson.findUnique({
            where: { id: lessonId },
            include: {
                section: {
                    include: {
                        lessons: true,
                        course: {
                            include: {
                                sections: {
                                    include: { lessons: true },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!lesson) {
            return { success: false, error: 'Lesson not found' };
        }

        // Mark lesson as complete
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

        // Calculate total lessons and completed count
        const totalLessons = lesson.section.course.sections.reduce(
            (acc, s) => acc + s.lessons.length,
            0,
        );

        const allLessonIds = lesson.section.course.sections.flatMap(s =>
            s.lessons.map(l => l.id),
        );

        const completedCount = await prisma.lessonProgress.count({
            where: {
                userId: user.userId,
                lessonId: { in: allLessonIds },
                completed: true,
            },
        });

        // Calculate progress
        const progress = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
        const courseCompleted = progress >= 100;

        // Check if section is completed
        const sectionLessonIds = lesson.section.lessons.map(l => l.id);
        const sectionCompletedCount = await prisma.lessonProgress.count({
            where: {
                userId: user.userId,
                lessonId: { in: sectionLessonIds },
                completed: true,
            },
        });
        const sectionCompleted = sectionCompletedCount >= sectionLessonIds.length;

        // Update enrollment
        await prisma.courseEnrollment.update({
            where: {
                userId_courseId: {
                    userId: user.userId,
                    courseId,
                },
            },
            data: {
                progress,
                currentLessonId: lessonId,
                completedAt: courseCompleted ? new Date() : undefined,
            },
        });

        // Award XP for completing lesson
        let totalXPAwarded = 0;
        let levelUp = false;

        // XP for lesson completion
        const lessonXPResult = await awardXP(
            'COMPLETE_LESSON',
            lessonId,
            `Completed lesson: ${lesson.title}`,
        );
        if (lessonXPResult.success && lessonXPResult.data) {
            totalXPAwarded += lessonXPResult.data.xpAwarded;
            levelUp = lessonXPResult.data.levelUp;
        }

        // Bonus XP for section completion
        if (sectionCompleted) {
            const sectionXPResult = await awardXP(
                'COMPLETE_SECTION',
                lesson.section.id,
                `Completed section: ${lesson.section.title}`,
            );
            if (sectionXPResult.success && sectionXPResult.data) {
                totalXPAwarded += sectionXPResult.data.xpAwarded;
                levelUp = levelUp || sectionXPResult.data.levelUp;
            }
        }

        // Bonus XP for course completion
        if (courseCompleted) {
            const courseXPResult = await awardXP(
                'COMPLETE_COURSE',
                courseId,
                `Completed course: ${lesson.section.course.title}`,
            );
            if (courseXPResult.success && courseXPResult.data) {
                totalXPAwarded += courseXPResult.data.xpAwarded;
                levelUp = levelUp || courseXPResult.data.levelUp;
            }
        }

        return {
            success: true,
            data: {
                progress,
                xpAwarded: totalXPAwarded,
                levelUp,
                sectionCompleted,
                courseCompleted,
            },
        };
    } catch (error) {
        console.error('[completeLessonWithXP] Error:', error);
        return { success: false, error: 'Failed to complete lesson' };
    }
};

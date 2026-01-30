// =============================================
// Course Learning Page - Server Component
// =============================================

import { STAKEHOLDER } from '@/constants/auth.constants';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/server/db/prisma';
import { type Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { CourseLearningClient } from './CourseLearningClient';

// =============================================
// Dynamic Metadata
// =============================================

export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string; lessonId: string }>;
}): Promise<Metadata> {
    const { slug, lessonId } = await params;

    const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId },
        include: {
            section: {
                include: {
                    course: {
                        select: { title: true, slug: true },
                    },
                },
            },
        },
    });

    if (!lesson || lesson.section.course.slug !== slug) {
        return { title: 'Lesson Not Found' };
    }

    return {
        title: `${lesson.title} | ${lesson.section.course.title}`,
        description: lesson.description ?? `Learn ${lesson.title} in ${lesson.section.course.title}`,
    };
}

// =============================================
// Page Component
// =============================================

export default async function CourseLearningPage({
    params,
}: {
    params: Promise<{ slug: string; lessonId: string }>;
}) {
    const { slug, lessonId } = await params;
    const user = await getCurrentUser(STAKEHOLDER.USER);

    // Fetch lesson with full data
    const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId },
        include: {
            section: {
                include: {
                    course: {
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
                            creator: {
                                select: {
                                    id: true,
                                    fullName: true,
                                    avatarLink: true,
                                },
                            },
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
            linkedContent: {
                include: {
                    content: {
                        select: {
                            id: true,
                            title: true,
                            slug: true,
                            type: true,
                        },
                    },
                },
                orderBy: { order: 'asc' },
            },
        },
    });

    if (!lesson) {
        notFound();
    }

    const course = lesson.section.course;

    // Verify course slug matches
    if (course.slug !== slug) {
        notFound();
    }

    // Verify course is published
    if (course.status !== 'PUBLISHED' || !course.isPublished) {
        notFound();
    }

    // Check access
    let isEnrolled = false;
    let enrollment: { progress: number; currentLessonId: string | null } | null = null;
    let completedLessonIds: string[] = [];

    if (user) {
        const enrollmentData = await prisma.courseEnrollment.findUnique({
            where: {
                userId_courseId: {
                    userId: user.userId,
                    courseId: course.id,
                },
            },
        });
        isEnrolled = !!enrollmentData;
        enrollment = enrollmentData;

        // Get completed lessons
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
    }

    // If lesson is not free and user is not enrolled, redirect to course page
    if (!lesson.isFree && !isEnrolled) {
        redirect(`/courses/${slug}?enroll=true`);
    }

    // Build navigation data
    const allLessons: Array<{ id: string; title: string; sectionId: string }> = [];
    for (const section of course.sections) {
        for (const l of section.lessons) {
            allLessons.push({ id: l.id, title: l.title, sectionId: section.id });
        }
    }

    const currentIndex = allLessons.findIndex(l => l.id === lessonId);
    const previousLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : undefined;
    const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : undefined;

    const totalLessons = allLessons.length;
    const isLessonCompleted = completedLessonIds.includes(lessonId);

    // Prepare sections with completion status
    const sectionsWithProgress = course.sections.map(section => ({
        id: section.id,
        title: section.title,
        order: section.order,
        lessons: section.lessons.map(l => ({
            id: l.id,
            title: l.title,
            order: l.order,
            isFree: l.isFree,
            isCompleted: completedLessonIds.includes(l.id),
        })),
    }));

    return (
        <CourseLearningClient
            lesson={{
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
                linkedContent: lesson.linkedContent.map(lc => ({
                    id: lc.content.id,
                    title: lc.content.title,
                    slug: lc.content.slug,
                    type: lc.content.type,
                })),
            }}
            course={{
                id: course.id,
                title: course.title,
                slug: course.slug,
                creator: course.creator,
            }}
            navigation={{
                sections: sectionsWithProgress,
                currentLessonId: lessonId,
                previousLesson,
                nextLesson,
                progress: enrollment?.progress ?? 0,
                completedLessons: completedLessonIds.length,
                totalLessons,
            }}
            isLoggedIn={!!user}
            isEnrolled={isEnrolled}
            isCompleted={isLessonCompleted}
        />
    );
}

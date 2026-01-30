// =============================================
// Course Detail Page - Server Component
// =============================================

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { CourseDetailClient } from './CourseDetailClient';

import { STAKEHOLDER } from '@/constants/auth.constants';
import { getCurrentUser } from '@/lib/auth';
import { getCourseBySlug, checkEnrollmentStatus } from '@/server/actions/content/publicCourseActions';
import { getCourseProgress } from '@/server/actions/progress/progressActions';
import { PublicLayout } from '@/components/layout/PublicLayout';

// =============================================
// Metadata
// =============================================

interface ICoursePageProps {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ICoursePageProps): Promise<Metadata> {
    const { slug } = await params;
    const response = await getCourseBySlug(slug);

    if (!response.success || !response.data) {
        return {
            title: 'Course Not Found | SakalSense',
        };
    }

    const course = response.data;

    return {
        title: `${course.title} | SakalSense`,
        description: course.description ?? `Learn ${course.title} with SakalSense`,
        openGraph: {
            title: course.title,
            description: course.description ?? undefined,
            images: course.thumbnailUrl ? [course.thumbnailUrl] : undefined,
        },
    };
}

// =============================================
// Page Component
// =============================================

export default async function CourseDetailPage({ params }: ICoursePageProps) {
    const { slug } = await params;
    const user = await getCurrentUser(STAKEHOLDER.USER);
    const response = await getCourseBySlug(slug, user?.userId);

    if (!response.success || !response.data) {
        notFound();
    }

    const course = response.data;

    // Check enrollment status
    let isEnrolled = false;
    let progress = 0;
    let currentLessonId: string | undefined;

    if (user) {
        const enrollmentResponse = await checkEnrollmentStatus(course.id, user.userId);
        isEnrolled = enrollmentResponse.isEnrolled;

        if (isEnrolled) {
            const progressResponse = await getCourseProgress(course.id);
            if (progressResponse.success && progressResponse.data) {
                progress = progressResponse.data.progress;
                currentLessonId = progressResponse.data.currentLessonId;
            }
        }
    }

    // Calculate lesson count
    const lessonCount = course.sections.reduce((acc, section) => acc + section.lessons.length, 0);

    return (
        <PublicLayout>
            <CourseDetailClient
                course={course}
                isEnrolled={isEnrolled}
                progress={progress}
                currentLessonId={currentLessonId}
                isLoggedIn={!!user}
                lessonCount={lessonCount}
            />
        </PublicLayout>
    );
}

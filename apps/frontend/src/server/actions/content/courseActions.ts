'use server';

import { type Prisma } from '@prisma/client';

import { STAKEHOLDER } from '@/constants/auth.constants';
import { type ContentStatusType, type DifficultyType } from '@/constants/content.constants';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/server/db/prisma';
import { type ICourse, type ICourseSection, type ILesson } from '@/types/content.types';

interface ICourseListResponse { success: boolean; data?: Array<ICourse>; total?: number; error?: string }
interface ICourseResponse { success: boolean; data?: ICourse & { sections: Array<ICourseSection & { lessons: Array<ILesson> }> }; error?: string }
interface ICourseActionResponse { success: boolean; data?: { id: string }; error?: string }
interface ICourseInput { title: string; slug: string; description?: string; thumbnailUrl?: string; difficulty: DifficultyType; estimatedHours?: number }
interface ISectionInput { title: string; description?: string; order: number }
interface ILessonInput { title: string; description?: string; order: number; body?: Prisma.InputJsonValue; isFree?: boolean }

// List courses
export const getCourseList = async (filters: { search?: string; status?: ContentStatusType; difficulty?: DifficultyType; page?: number; limit?: number }): Promise<ICourseListResponse> => {
    try {
        const user = await getCurrentUser(STAKEHOLDER.ADMIN);
        if (!user) return { success: false, error: 'Unauthorized' };

        const { search = '', status, difficulty, page = 1, limit = 20 } = filters;
        const where = { creatorId: user.userId, ...(search && { OR: [{ title: { contains: search, mode: 'insensitive' as const } }, { slug: { contains: search, mode: 'insensitive' as const } }] }), ...(status && { status }), ...(difficulty && { difficulty }) };
        const [data, total] = await Promise.all([prisma.course.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }), prisma.course.count({ where })]);
        return { success: true, data: data as unknown as Array<ICourse>, total };
    } catch (error) { console.error('getCourseList error:', error); return { success: false, error: 'Failed to fetch courses' }; }
};

// Get course with sections and lessons
export const getCourseById = async (id: string): Promise<ICourseResponse> => {
    try {
        const user = await getCurrentUser(STAKEHOLDER.ADMIN);
        if (!user) return { success: false, error: 'Unauthorized' };

        const course = await prisma.course.findFirst({ where: { id, creatorId: user.userId }, include: { sections: { orderBy: { order: 'asc' }, include: { lessons: { orderBy: { order: 'asc' } } } } } });
        if (!course) return { success: false, error: 'Course not found' };
        return { success: true, data: course as unknown as ICourse & { sections: Array<ICourseSection & { lessons: Array<ILesson> }> } };
    } catch (error) { console.error('getCourseById error:', error); return { success: false, error: 'Failed to fetch course' }; }
};

// Create course
export const createCourse = async (input: ICourseInput): Promise<ICourseActionResponse> => {
    try {
        const user = await getCurrentUser(STAKEHOLDER.ADMIN);
        if (!user) return { success: false, error: 'Unauthorized' };

        const existing = await prisma.course.findUnique({ where: { slug: input.slug } });
        if (existing) return { success: false, error: 'Slug already exists' };

        const course = await prisma.course.create({ data: { ...input, creatorId: user.userId } });
        return { success: true, data: { id: course.id } };
    } catch (error) { console.error('createCourse error:', error); return { success: false, error: 'Failed to create course' }; }
};

// Update course
export const updateCourse = async (id: string, input: Partial<ICourseInput>): Promise<ICourseActionResponse> => {
    try {
        const user = await getCurrentUser(STAKEHOLDER.ADMIN);
        if (!user) return { success: false, error: 'Unauthorized' };

        const existing = await prisma.course.findFirst({ where: { id, creatorId: user.userId } });
        if (!existing) return { success: false, error: 'Course not found' };

        if (input.slug && input.slug !== existing.slug) {
            const slugExists = await prisma.course.findFirst({ where: { slug: input.slug, id: { not: id } } });
            if (slugExists) return { success: false, error: 'Slug already exists' };
        }

        await prisma.course.update({ where: { id }, data: input });
        return { success: true, data: { id } };
    } catch (error) { console.error('updateCourse error:', error); return { success: false, error: 'Failed to update course' }; }
};

// Add section to course
export const addCourseSection = async (courseId: string, input: ISectionInput): Promise<ICourseActionResponse> => {
    try {
        const user = await getCurrentUser(STAKEHOLDER.ADMIN);
        if (!user) return { success: false, error: 'Unauthorized' };

        const course = await prisma.course.findFirst({ where: { id: courseId, creatorId: user.userId } });
        if (!course) return { success: false, error: 'Course not found' };

        const section = await prisma.courseSection.create({ data: { courseId, ...input } });
        return { success: true, data: { id: section.id } };
    } catch (error) { console.error('addCourseSection error:', error); return { success: false, error: 'Failed to add section' }; }
};

// Add lesson to section
export const addLesson = async (sectionId: string, input: ILessonInput): Promise<ICourseActionResponse> => {
    try {
        const user = await getCurrentUser(STAKEHOLDER.ADMIN);
        if (!user) return { success: false, error: 'Unauthorized' };

        const section = await prisma.courseSection.findFirst({ where: { id: sectionId }, include: { course: true } });
        if (!section || section.course.creatorId !== user.userId) return { success: false, error: 'Section not found' };

        const lesson = await prisma.lesson.create({ data: { sectionId, ...input } });
        return { success: true, data: { id: lesson.id } };
    } catch (error) { console.error('addLesson error:', error); return { success: false, error: 'Failed to add lesson' }; }
};

// Delete course
export const deleteCourse = async (id: string): Promise<ICourseActionResponse> => {
    try {
        const user = await getCurrentUser(STAKEHOLDER.ADMIN);
        if (!user) return { success: false, error: 'Unauthorized' };

        const existing = await prisma.course.findFirst({ where: { id, creatorId: user.userId } });
        if (!existing) return { success: false, error: 'Course not found' };

        await prisma.course.delete({ where: { id } });
        return { success: true, data: { id } };
    } catch (error) { console.error('deleteCourse error:', error); return { success: false, error: 'Failed to delete course' }; }
};

// Publish course
export const publishCourse = async (id: string): Promise<ICourseActionResponse> => {
    try {
        const user = await getCurrentUser(STAKEHOLDER.ADMIN);
        if (!user) return { success: false, error: 'Unauthorized' };

        const existing = await prisma.course.findFirst({ where: { id, creatorId: user.userId } });
        if (!existing) return { success: false, error: 'Course not found' };

        await prisma.course.update({ where: { id }, data: { status: 'PUBLISHED', isPublished: true, publishedAt: new Date() } });
        return { success: true, data: { id } };
    } catch (error) { console.error('publishCourse error:', error); return { success: false, error: 'Failed to publish course' }; }
};

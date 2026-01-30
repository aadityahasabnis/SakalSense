// useCourseActions — Optimized hook for course CRUD operations

import { useCallback, useState } from 'react';

import { type Prisma } from '@prisma/client';
import { useAtom } from 'jotai';

import { type ContentStatusType, type DifficultyType } from '@/constants/content.constants';
import { addNotificationAtom } from '@/jotai/atoms';
import { addCourseSection, addLesson, createCourse, deleteCourse, getCourseById, getCourseList, publishCourse, updateCourse } from '@/server/actions/content/courseActions';
import { type ICourse } from '@/types/content.types';

interface ICourseFilters { search?: string; status?: ContentStatusType; difficulty?: DifficultyType; page?: number; limit?: number }
interface ICourseInput { title: string; slug: string; description?: string; thumbnailUrl?: string; difficulty: DifficultyType; estimatedHours?: number }
interface ISectionInput { title: string; description?: string; order: number }
interface ILessonInput { title: string; description?: string; order: number; body?: Prisma.InputJsonValue; isFree?: boolean }

export const useCourseList = () => {
    const [, addNotification] = useAtom(addNotificationAtom);
    const [data, setData] = useState<Array<ICourse>>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);

    const fetchList = useCallback(async (filters: ICourseFilters) => {
        setLoading(true);
        const result = await getCourseList(filters);
        if (result.success && result.data) { setData(result.data); setTotal(result.total ?? 0); }
        else addNotification({ type: 'error', message: result.error ?? 'Failed to load courses' });
        setLoading(false);
    }, [addNotification]);

    return { data, total, loading, fetchList };
};

export const useCourseActions = () => {
    const [, addNotification] = useAtom(addNotificationAtom);
    const [loading, setLoading] = useState(false);

    const create = useCallback(async (input: ICourseInput): Promise<string | null> => {
        setLoading(true);
        const result = await createCourse(input);
        if (result.success && result.data?.id) {
            addNotification({ type: 'success', message: 'Course created successfully' });
            setLoading(false);
            return result.data.id;
        }
        addNotification({ type: 'error', message: result.error ?? 'Failed to create course' });
        setLoading(false);
        return null;
    }, [addNotification]);

    const update = useCallback(async (id: string, input: Partial<ICourseInput>): Promise<boolean> => {
        setLoading(true);
        const result = await updateCourse(id, input);
        if (result.success) { addNotification({ type: 'success', message: 'Course updated successfully' }); setLoading(false); return true; }
        addNotification({ type: 'error', message: result.error ?? 'Failed to update course' });
        setLoading(false);
        return false;
    }, [addNotification]);

    const remove = useCallback(async (id: string, onSuccess?: () => void): Promise<boolean> => {
        const result = await deleteCourse(id);
        if (result.success) { addNotification({ type: 'success', message: 'Course deleted successfully' }); onSuccess?.(); return true; }
        addNotification({ type: 'error', message: result.error ?? 'Failed to delete course' });
        return false;
    }, [addNotification]);

    const publish = useCallback(async (id: string, onSuccess?: () => void): Promise<boolean> => {
        const result = await publishCourse(id);
        if (result.success) { addNotification({ type: 'success', message: 'Course published successfully' }); onSuccess?.(); return true; }
        addNotification({ type: 'error', message: result.error ?? 'Failed to publish course' });
        return false;
    }, [addNotification]);

    const addSection = useCallback(async (courseId: string, input: ISectionInput): Promise<string | null> => {
        const result = await addCourseSection(courseId, input);
        if (result.success && result.data?.id) {
            addNotification({ type: 'success', message: 'Section added successfully' });
            return result.data.id;
        }
        addNotification({ type: 'error', message: result.error ?? 'Failed to add section' });
        return null;
    }, [addNotification]);

    const addLessonToSection = useCallback(async (sectionId: string, input: ILessonInput): Promise<string | null> => {
        const result = await addLesson(sectionId, input);
        if (result.success && result.data?.id) {
            addNotification({ type: 'success', message: 'Lesson added successfully' });
            return result.data.id;
        }
        addNotification({ type: 'error', message: result.error ?? 'Failed to add lesson' });
        return null;
    }, [addNotification]);

    return { create, update, remove, publish, addSection, addLessonToSection, loading };
};

export const useCourseDetail = (id: string) => {
    const [, addNotification] = useAtom(addNotificationAtom);
    const [data, setData] = useState<any>(undefined);
    const [loading, setLoading] = useState(true);

    const fetch = useCallback(async () => {
        setLoading(true);
        const result = await getCourseById(id);
        if (result.success && result.data) setData(result.data);
        else addNotification({ type: 'error', message: result.error ?? 'Failed to load course' });
        setLoading(false);
    }, [id, addNotification]);

    return { data, loading, fetch };
};

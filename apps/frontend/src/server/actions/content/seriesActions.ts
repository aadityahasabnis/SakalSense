'use server';

import { STAKEHOLDER } from '@/constants/auth.constants';
import  { type ContentStatusType, type ContentType } from '@/constants/content.constants';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/server/db/prisma';
import  { type ISeries, type ISeriesWithItems } from '@/types/content.types';

interface ISeriesListResponse { success: boolean; data?: Array<ISeries>; total?: number; error?: string }
interface ISeriesResponse { success: boolean; data?: ISeriesWithItems; error?: string }
interface ISeriesActionResponse { success: boolean; data?: { id: string }; error?: string }
interface ISeriesInput { title: string; slug: string; description?: string; thumbnailUrl?: string; contentType: ContentType }
interface ISeriesItemInput { contentId: string; order: number }

// List series
export const getSeriesList = async (filters: { search?: string; contentType?: ContentType; status?: ContentStatusType; page?: number; limit?: number }): Promise<ISeriesListResponse> => {
    try {
        const user = await getCurrentUser(STAKEHOLDER.ADMIN);
        if (!user) return { success: false, error: 'Unauthorized' };

        const { search = '', contentType, status, page = 1, limit = 20 } = filters;
        const where = { creatorId: user.userId, ...(search && { OR: [{ title: { contains: search, mode: 'insensitive' as const } }, { slug: { contains: search, mode: 'insensitive' as const } }] }), ...(contentType && { contentType }), ...(status && { status }) };
        const [data, total] = await Promise.all([prisma.series.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }), prisma.series.count({ where })]);
        return { success: true, data: data as unknown as Array<ISeries>, total };
    } catch (error) { console.error('getSeriesList error:', error); return { success: false, error: 'Failed to fetch series' }; }
};

// Get single series with items
export const getSeriesById = async (id: string): Promise<ISeriesResponse> => {
    try {
        const user = await getCurrentUser(STAKEHOLDER.ADMIN);
        if (!user) return { success: false, error: 'Unauthorized' };

        const series = await prisma.series.findFirst({ where: { id, creatorId: user.userId }, include: { items: { orderBy: { order: 'asc' }, include: { content: { select: { id: true, title: true, slug: true, type: true, status: true, difficulty: true, viewCount: true, likeCount: true, createdAt: true, publishedAt: true, creator: { select: { fullName: true } } } } } }, creator: { select: { fullName: true, avatarLink: true } } } });
        if (!series) return { success: false, error: 'Series not found' };
        return { success: true, data: series as unknown as ISeriesWithItems };
    } catch (error) { console.error('getSeriesById error:', error); return { success: false, error: 'Failed to fetch series' }; }
};

// Create series
export const createSeries = async (input: ISeriesInput): Promise<ISeriesActionResponse> => {
    try {
        const user = await getCurrentUser(STAKEHOLDER.ADMIN);
        if (!user) return { success: false, error: 'Unauthorized' };

        const existing = await prisma.series.findUnique({ where: { slug: input.slug } });
        if (existing) return { success: false, error: 'Slug already exists' };

        const series = await prisma.series.create({ data: { ...input, creatorId: user.userId } });
        return { success: true, data: { id: series.id } };
    } catch (error) { console.error('createSeries error:', error); return { success: false, error: 'Failed to create series' }; }
};

// Update series
export const updateSeries = async (id: string, input: Partial<ISeriesInput>): Promise<ISeriesActionResponse> => {
    try {
        const user = await getCurrentUser(STAKEHOLDER.ADMIN);
        if (!user) return { success: false, error: 'Unauthorized' };

        const existing = await prisma.series.findFirst({ where: { id, creatorId: user.userId } });
        if (!existing) return { success: false, error: 'Series not found' };

        if (input.slug && input.slug !== existing.slug) {
            const slugExists = await prisma.series.findFirst({ where: { slug: input.slug, id: { not: id } } });
            if (slugExists) return { success: false, error: 'Slug already exists' };
        }

        await prisma.series.update({ where: { id }, data: input });
        return { success: true, data: { id } };
    } catch (error) { console.error('updateSeries error:', error); return { success: false, error: 'Failed to update series' }; }
};

// Add item to series
export const addSeriesItem = async (seriesId: string, input: ISeriesItemInput): Promise<ISeriesActionResponse> => {
    try {
        const user = await getCurrentUser(STAKEHOLDER.ADMIN);
        if (!user) return { success: false, error: 'Unauthorized' };

        const series = await prisma.series.findFirst({ where: { id: seriesId, creatorId: user.userId } });
        if (!series) return { success: false, error: 'Series not found' };

        await prisma.seriesItem.create({ data: { seriesId, contentId: input.contentId, order: input.order } });
        return { success: true, data: { id: seriesId } };
    } catch (error) { console.error('addSeriesItem error:', error); return { success: false, error: 'Failed to add item to series' }; }
};

// Remove item from series
export const removeSeriesItem = async (seriesId: string, contentId: string): Promise<ISeriesActionResponse> => {
    try {
        const user = await getCurrentUser(STAKEHOLDER.ADMIN);
        if (!user) return { success: false, error: 'Unauthorized' };

        const series = await prisma.series.findFirst({ where: { id: seriesId, creatorId: user.userId } });
        if (!series) return { success: false, error: 'Series not found' };

        await prisma.seriesItem.deleteMany({ where: { seriesId, contentId } });
        return { success: true, data: { id: seriesId } };
    } catch (error) { console.error('removeSeriesItem error:', error); return { success: false, error: 'Failed to remove item from series' }; }
};

// Reorder series items
export const reorderSeriesItems = async (seriesId: string, items: Array<{ id: string; order: number }>): Promise<ISeriesActionResponse> => {
    try {
        const user = await getCurrentUser(STAKEHOLDER.ADMIN);
        if (!user) return { success: false, error: 'Unauthorized' };

        const series = await prisma.series.findFirst({ where: { id: seriesId, creatorId: user.userId } });
        if (!series) return { success: false, error: 'Series not found' };

        await prisma.$transaction(items.map((item) => prisma.seriesItem.update({ where: { id: item.id }, data: { order: item.order } })));
        return { success: true, data: { id: seriesId } };
    } catch (error) { console.error('reorderSeriesItems error:', error); return { success: false, error: 'Failed to reorder items' }; }
};

// Delete series
export const deleteSeries = async (id: string): Promise<ISeriesActionResponse> => {
    try {
        const user = await getCurrentUser(STAKEHOLDER.ADMIN);
        if (!user) return { success: false, error: 'Unauthorized' };

        const existing = await prisma.series.findFirst({ where: { id, creatorId: user.userId } });
        if (!existing) return { success: false, error: 'Series not found' };

        await prisma.series.delete({ where: { id } });
        return { success: true, data: { id } };
    } catch (error) { console.error('deleteSeries error:', error); return { success: false, error: 'Failed to delete series' }; }
};

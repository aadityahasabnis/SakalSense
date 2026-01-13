'use server';

import { STAKEHOLDER } from '@/constants/auth.constants';
import  { type ContentStatusType, type ContentType, type DifficultyType } from '@/constants/content.constants';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/server/db/prisma';
import { type IContentInput, type IContentListItem, type IContentWithRelations } from '@/types/content.types';

// Response types
interface IContentListResponse { success: boolean; data?: Array<IContentListItem>; total?: number; error?: string }
interface IContentResponse { success: boolean; data?: IContentWithRelations; error?: string }
interface IContentActionResponse { success: boolean; data?: { id: string }; error?: string }

// List content with filters
export const getContentList = async (filters: { search?: string; type?: ContentType; status?: ContentStatusType; difficulty?: DifficultyType; page?: number; limit?: number; sortField?: string; sortDir?: 'asc' | 'desc' }): Promise<IContentListResponse> => {
    try {
        const user = await getCurrentUser(STAKEHOLDER.ADMIN);
        if (!user) return { success: false, error: 'Unauthorized' };

        const { search = '', type, status, difficulty, page = 1, limit = 20, sortField = 'createdAt', sortDir = 'desc' } = filters;
        const where = { creatorId: user.userId, ...(search && { OR: [{ title: { contains: search, mode: 'insensitive' as const } }, { slug: { contains: search, mode: 'insensitive' as const } }] }), ...(type && { type }), ...(status && { status }), ...(difficulty && { difficulty }) };
        const [data, total] = await Promise.all([
            prisma.content.findMany({ where, select: { id: true, title: true, slug: true, type: true, status: true, difficulty: true, viewCount: true, likeCount: true, createdAt: true, publishedAt: true, creator: { select: { fullName: true } } }, orderBy: { [sortField]: sortDir }, skip: (page - 1) * limit, take: limit }),
            prisma.content.count({ where }),
        ]);
        return { success: true, data: data as unknown as Array<IContentListItem>, total };
    } catch (error) { console.error('getContentList error:', error); return { success: false, error: 'Failed to fetch content' }; }
};

// Get single content by ID
export const getContentById = async (id: string): Promise<IContentResponse> => {
    try {
        const user = await getCurrentUser(STAKEHOLDER.ADMIN);
        if (!user) return { success: false, error: 'Unauthorized' };

        const content = await prisma.content.findFirst({ where: { id, creatorId: user.userId }, include: { creator: { select: { id: true, fullName: true, avatarLink: true } }, category: { select: { id: true, name: true, slug: true } }, topics: { include: { topic: { select: { id: true, name: true, slug: true } } } } } });
        if (!content) return { success: false, error: 'Content not found' };

        const data: IContentWithRelations = { ...content, topics: content.topics.map((t: { topic: { id: string; name: string; slug: string } }) => t.topic) } as unknown as IContentWithRelations;
        return { success: true, data };
    } catch (error) { console.error('getContentById error:', error); return { success: false, error: 'Failed to fetch content' }; }
};

// Create content
export const createContent = async (input: IContentInput): Promise<IContentActionResponse> => {
    try {
        const user = await getCurrentUser(STAKEHOLDER.ADMIN);
        if (!user) return { success: false, error: 'Unauthorized' };

        const existing = await prisma.content.findUnique({ where: { slug: input.slug } });
        if (existing) return { success: false, error: 'Slug already exists' };

        const { topicIds, categoryId, ...restData } = input;

        // Validate category exists if provided
        const validCategoryId = categoryId ? (await prisma.category.findUnique({ where: { id: categoryId } }))?.id : undefined;

        const content = await prisma.content.create({ data: { ...restData, creatorId: user.userId, ...(validCategoryId && { categoryId: validCategoryId }), ...(topicIds && topicIds.length > 0 && { topics: { create: topicIds.map((topicId) => ({ topicId })) } }) } });
        return { success: true, data: { id: content.id } };
    } catch (error) { console.error('createContent error:', error); return { success: false, error: 'Failed to create content' }; }
};

// Update content
export const updateContent = async (id: string, input: Partial<IContentInput>): Promise<IContentActionResponse> => {
    try {
        const user = await getCurrentUser(STAKEHOLDER.ADMIN);
        if (!user) return { success: false, error: 'Unauthorized' };

        const existing = await prisma.content.findFirst({ where: { id, creatorId: user.userId } });
        if (!existing) return { success: false, error: 'Content not found' };

        if (input.slug && input.slug !== existing.slug) {
            const slugExists = await prisma.content.findFirst({ where: { slug: input.slug, id: { not: id } } });
            if (slugExists) return { success: false, error: 'Slug already exists' };
        }

        const { topicIds, categoryId, ...restData } = input;

        // Validate category exists if provided
        const validCategoryId = categoryId ? (await prisma.category.findUnique({ where: { id: categoryId } }))?.id : undefined;

        await prisma.content.update({ where: { id }, data: { ...restData, ...(categoryId !== undefined && { categoryId: validCategoryId ?? null }), ...(topicIds && { topics: { deleteMany: {}, create: topicIds.map((topicId) => ({ topicId })) } }) } });
        return { success: true, data: { id } };
    } catch (error) { console.error('updateContent error:', error); return { success: false, error: 'Failed to update content' }; }
};

// Delete content
export const deleteContent = async (id: string): Promise<IContentActionResponse> => {
    try {
        const user = await getCurrentUser(STAKEHOLDER.ADMIN);
        if (!user) return { success: false, error: 'Unauthorized' };

        const existing = await prisma.content.findFirst({ where: { id, creatorId: user.userId } });
        if (!existing) return { success: false, error: 'Content not found' };

        await prisma.content.delete({ where: { id } });
        return { success: true, data: { id } };
    } catch (error) { console.error('deleteContent error:', error); return { success: false, error: 'Failed to delete content' }; }
};

// Publish content
export const publishContent = async (id: string): Promise<IContentActionResponse> => {
    try {
        const user = await getCurrentUser(STAKEHOLDER.ADMIN);
        if (!user) return { success: false, error: 'Unauthorized' };

        const existing = await prisma.content.findFirst({ where: { id, creatorId: user.userId } });
        if (!existing) return { success: false, error: 'Content not found' };

        await prisma.content.update({ where: { id }, data: { status: 'PUBLISHED', publishedAt: new Date() } });
        return { success: true, data: { id } };
    } catch (error) { console.error('publishContent error:', error); return { success: false, error: 'Failed to publish content' }; }
};

// Archive content
export const archiveContent = async (id: string): Promise<IContentActionResponse> => {
    try {
        const user = await getCurrentUser(STAKEHOLDER.ADMIN);
        if (!user) return { success: false, error: 'Unauthorized' };

        const existing = await prisma.content.findFirst({ where: { id, creatorId: user.userId } });
        if (!existing) return { success: false, error: 'Content not found' };

        await prisma.content.update({ where: { id }, data: { status: 'ARCHIVED' } });
        return { success: true, data: { id } };
    } catch (error) { console.error('archiveContent error:', error); return { success: false, error: 'Failed to archive content' }; }
};

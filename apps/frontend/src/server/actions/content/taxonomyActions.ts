'use server';

import { prisma } from '@/server/db/prisma';
import  { type ICategory, type IDomain, type ITopic } from '@/types/content.types';

interface IDomainListResponse { success: boolean; data?: Array<IDomain>; error?: string }
interface ICategoryListResponse { success: boolean; data?: Array<ICategory>; error?: string }
interface ITopicListResponse { success: boolean; data?: Array<ITopic>; error?: string }

// Get all domains
export const getDomains = async (): Promise<IDomainListResponse> => {
    try {
        const data = await prisma.domain.findMany({ where: { isActive: true }, orderBy: { order: 'asc' } });
        return { success: true, data: data as unknown as Array<IDomain> };
    } catch (error) { console.error('getDomains error:', error); return { success: false, error: 'Failed to fetch domains' }; }
};

// Get categories by domain
export const getCategoriesByDomain = async (domainId: string): Promise<ICategoryListResponse> => {
    try {
        const data = await prisma.category.findMany({ where: { domainId }, orderBy: { order: 'asc' } });
        return { success: true, data: data as unknown as Array<ICategory> };
    } catch (error) { console.error('getCategoriesByDomain error:', error); return { success: false, error: 'Failed to fetch categories' }; }
};

// Get all categories (flat)
export const getAllCategories = async (): Promise<ICategoryListResponse> => {
    try {
        const data = await prisma.category.findMany({ orderBy: [{ domain: { order: 'asc' } }, { order: 'asc' }], include: { domain: { select: { name: true } } } });
        return { success: true, data: data as unknown as Array<ICategory> };
    } catch (error) { console.error('getAllCategories error:', error); return { success: false, error: 'Failed to fetch categories' }; }
};

// Search topics
export const searchTopics = async (query: string, limit = 10): Promise<ITopicListResponse> => {
    try {
        const data = await prisma.topic.findMany({ where: { OR: [{ name: { contains: query, mode: 'insensitive' } }, { slug: { contains: query, mode: 'insensitive' } }] }, take: limit, orderBy: { name: 'asc' } });
        return { success: true, data: data as unknown as Array<ITopic> };
    } catch (error) { console.error('searchTopics error:', error); return { success: false, error: 'Failed to search topics' }; }
};

// Get or create topic
export const getOrCreateTopic = async (name: string): Promise<{ success: boolean; data?: ITopic; error?: string }> => {
    try {
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        let topic = await prisma.topic.findUnique({ where: { slug } });
        topic ??= await prisma.topic.create({ data: { name, slug } });
        return { success: true, data: topic as unknown as ITopic };
    } catch (error) { console.error('getOrCreateTopic error:', error); return { success: false, error: 'Failed to get/create topic' }; }
};

// Get popular topics
export const getPopularTopics = async (limit = 20): Promise<ITopicListResponse> => {
    try {
        const data = await prisma.topic.findMany({ take: limit, orderBy: { followers: { _count: 'desc' } }, include: { _count: { select: { contents: true, followers: true } } } });
        return { success: true, data: data as unknown as Array<ITopic> };
    } catch (error) { console.error('getPopularTopics error:', error); return { success: false, error: 'Failed to fetch popular topics' }; }
};

// =============================================
// Domain Details with Categories
// =============================================

interface IDomainWithCategories extends IDomain {
    categories: Array<ICategory & { _count: { contents: number } }>;
}

interface IDomainDetailsResponse {
    success: boolean;
    data?: IDomainWithCategories;
    error?: string;
}

// Get domain by slug with categories
export const getDomainBySlug = async (slug: string): Promise<IDomainDetailsResponse> => {
    try {
        const domain = await prisma.domain.findFirst({
            where: { slug, isActive: true },
            include: {
                categories: {
                    orderBy: { order: 'asc' },
                    include: {
                        _count: {
                            select: {
                                contents: true,
                            },
                        },
                    },
                },
            },
        });

        if (!domain) {
            return { success: false, error: 'Domain not found' };
        }

        return { success: true, data: domain as unknown as IDomainWithCategories };
    } catch (error) {
        console.error('getDomainBySlug error:', error);
        return { success: false, error: 'Failed to fetch domain' };
    }
};

// Get content by domain
export const getContentByDomain = async (
    domainSlug: string,
    filters: {
        categoryId?: string;
        search?: string;
        page?: number;
        limit?: number;
    }
): Promise<{ success: boolean; data?: unknown[]; total?: number; error?: string }> => {
    try {
        const { categoryId, search = '', page = 1, limit = 12 } = filters;

        // First get the domain with its category IDs
        const domain = await prisma.domain.findFirst({
            where: { slug: domainSlug, isActive: true },
            select: { 
                id: true,
                categories: { select: { id: true } },
            },
        });

        if (!domain) {
            return { success: false, error: 'Domain not found' };
        }

        const categoryIds = domain.categories.map((c) => c.id);

        const where = {
            status: 'PUBLISHED',
            categoryId: categoryId ? categoryId : { in: categoryIds },
            ...(search && {
                OR: [
                    { title: { contains: search, mode: 'insensitive' as const } },
                    { description: { contains: search, mode: 'insensitive' as const } },
                ],
            }),
        };

        const [data, total] = await Promise.all([
            prisma.content.findMany({
                where,
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    description: true,
                    type: true,
                    difficulty: true,
                    thumbnailUrl: true,
                    viewCount: true,
                    likeCount: true,
                    publishedAt: true,
                    creator: {
                        select: {
                            fullName: true,
                            avatarLink: true,
                        },
                    },
                    category: {
                        select: {
                            name: true,
                            slug: true,
                        },
                    },
                },
                orderBy: { publishedAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.content.count({ where }),
        ]);

        return { success: true, data, total };
    } catch (error) {
        console.error('getContentByDomain error:', error);
        return { success: false, error: 'Failed to fetch content' };
    }
};

'use server';

import { prisma } from '@/server/db/prisma';
import  { type ICategory, type IDomain, type ITopic } from '@/types/content.types';

interface IDomainListResponse { success: boolean; data?: Array<IDomain>; error?: string }
interface ICategoryListResponse { success: boolean; data?: Array<ICategory>; error?: string }
interface ITopicListResponse { success: boolean; data?: Array<ITopic>; error?: string }

// Get all domains
export const getDomains = async (): Promise<IDomainListResponse> => {
    try {
        const data = await prisma.domain.findMany({ where: { isActive: true }, orderBy: { order: 'asc' }, cacheStrategy: { ttl: 60, swr: 20 } });
        return { success: true, data: data as unknown as Array<IDomain> };
    } catch (error) { console.error('getDomains error:', error); return { success: false, error: 'Failed to fetch domains' }; }
};

// Get categories by domain
export const getCategoriesByDomain = async (domainId: string): Promise<ICategoryListResponse> => {
    try {
        const data = await prisma.category.findMany({ where: { domainId }, orderBy: { order: 'asc' }, cacheStrategy: { ttl: 60 } });
        return { success: true, data: data as unknown as Array<ICategory> };
    } catch (error) { console.error('getCategoriesByDomain error:', error); return { success: false, error: 'Failed to fetch categories' }; }
};

// Get all categories (flat)
export const getAllCategories = async (): Promise<ICategoryListResponse> => {
    try {
        const data = await prisma.category.findMany({ orderBy: [{ domain: { order: 'asc' } }, { order: 'asc' }], include: { domain: { select: { name: true } } }, cacheStrategy: { ttl: 60 } });
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
        const data = await prisma.topic.findMany({ take: limit, orderBy: { followers: { _count: 'desc' } }, include: { _count: { select: { contents: true, followers: true } } }, cacheStrategy: { ttl: 60 } });
        return { success: true, data: data as unknown as Array<ITopic> };
    } catch (error) { console.error('getPopularTopics error:', error); return { success: false, error: 'Failed to fetch popular topics' }; }
};

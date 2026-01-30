'use server';
// =============================================
// Administrator Taxonomy Actions - Manage Domains, Categories, Topics
// =============================================

import { cookies } from 'next/headers';

import { AUTH_COOKIE } from '@/constants/auth.constants';
import { prisma } from '@/server/db/prisma';
import { verifyJWT } from '@/server/utils/jwt';

// =============================================
// Helpers
// =============================================

const verifyAdministrator = async (): Promise<{ userId: string } | null> => {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE.ADMINISTRATOR)?.value;
    if (!token) return null;
    const payload = await verifyJWT(token);
    return payload?.role === 'ADMINISTRATOR' ? { userId: payload.userId } : null;
};

const generateSlug = (name: string): string => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

// =============================================
// Domain Types
// =============================================

interface IDomainInput { name: string; description?: string; icon?: string; order?: number }
interface IDomainResponse { success: boolean; data?: { id: string }; error?: string }
interface IDomainListResponse { success: boolean; data?: Array<{ id: string; name: string; slug: string; description?: string; icon?: string; order: number; isActive: boolean; _count: { categories: number }; createdAt: Date }>; error?: string }

// =============================================
// Domain Actions
// =============================================

export const getDomainList = async (): Promise<IDomainListResponse> => {
    const admin = await verifyAdministrator();
    if (!admin) return { success: false, error: 'Unauthorized' };
    try {
        const data = await prisma.domain.findMany({ orderBy: { order: 'asc' }, include: { _count: { select: { categories: true } } } });
        return { success: true, data: data as IDomainListResponse['data'] };
    } catch (error) { console.error('getDomainList error:', error); return { success: false, error: 'Failed to fetch domains' }; }
};

export const createDomain = async (input: IDomainInput): Promise<IDomainResponse> => {
    const admin = await verifyAdministrator();
    if (!admin) return { success: false, error: 'Unauthorized' };
    if (!input.name?.trim()) return { success: false, error: 'Name is required' };
    try {
        const slug = generateSlug(input.name);
        const existing = await prisma.domain.findUnique({ where: { slug } });
        if (existing) return { success: false, error: 'Domain with this name already exists' };
        const domain = await prisma.domain.create({ data: { name: input.name.trim(), slug, description: input.description?.trim(), icon: input.icon, order: input.order ?? 0 } });
        return { success: true, data: { id: domain.id } };
    } catch (error) { console.error('createDomain error:', error); return { success: false, error: 'Failed to create domain' }; }
};

export const updateDomain = async (id: string, input: Partial<IDomainInput>): Promise<IDomainResponse> => {
    const admin = await verifyAdministrator();
    if (!admin) return { success: false, error: 'Unauthorized' };
    try {
        const existing = await prisma.domain.findUnique({ where: { id } });
        if (!existing) return { success: false, error: 'Domain not found' };
        const updateData: Record<string, unknown> = {};
        if (input.name !== undefined) { updateData.name = input.name.trim(); updateData.slug = generateSlug(input.name); }
        if (input.description !== undefined) updateData.description = input.description.trim();
        if (input.icon !== undefined) updateData.icon = input.icon;
        if (input.order !== undefined) updateData.order = input.order;
        await prisma.domain.update({ where: { id }, data: updateData });
        return { success: true, data: { id } };
    } catch (error) { console.error('updateDomain error:', error); return { success: false, error: 'Failed to update domain' }; }
};

export const deleteDomain = async (id: string): Promise<IDomainResponse> => {
    const admin = await verifyAdministrator();
    if (!admin) return { success: false, error: 'Unauthorized' };
    try {
        const domain = await prisma.domain.findUnique({ where: { id }, include: { _count: { select: { categories: true } } } });
        if (!domain) return { success: false, error: 'Domain not found' };
        if (domain._count.categories > 0) return { success: false, error: `Cannot delete: ${domain._count.categories} categories exist` };
        await prisma.domain.delete({ where: { id } });
        return { success: true, data: { id } };
    } catch (error) { console.error('deleteDomain error:', error); return { success: false, error: 'Failed to delete domain' }; }
};

export const toggleDomainActive = async (id: string): Promise<IDomainResponse> => {
    const admin = await verifyAdministrator();
    if (!admin) return { success: false, error: 'Unauthorized' };
    try {
        const domain = await prisma.domain.findUnique({ where: { id } });
        if (!domain) return { success: false, error: 'Domain not found' };
        await prisma.domain.update({ where: { id }, data: { isActive: !domain.isActive } });
        return { success: true, data: { id } };
    } catch (error) { console.error('toggleDomainActive error:', error); return { success: false, error: 'Failed to toggle domain' }; }
};

// =============================================
// Category Types
// =============================================

interface ICategoryInput { name: string; description?: string; icon?: string; domainId: string; parentId?: string; order?: number }
interface ICategoryResponse { success: boolean; data?: { id: string }; error?: string }
interface ICategoryListResponse { success: boolean; data?: Array<{ id: string; name: string; slug: string; description?: string; icon?: string; domainId: string; parentId?: string; order: number; domain: { name: string }; _count: { contents: number }; createdAt: Date }>; error?: string }

// =============================================
// Category Actions
// =============================================

export const getCategoryList = async (domainId?: string): Promise<ICategoryListResponse> => {
    const admin = await verifyAdministrator();
    if (!admin) return { success: false, error: 'Unauthorized' };
    try {
        const where = domainId ? { domainId } : {};
        const data = await prisma.category.findMany({ where, orderBy: [{ domain: { order: 'asc' } }, { order: 'asc' }], include: { domain: { select: { name: true } }, _count: { select: { contents: true } } } });
        return { success: true, data: data as ICategoryListResponse['data'] };
    } catch (error) { console.error('getCategoryList error:', error); return { success: false, error: 'Failed to fetch categories' }; }
};

export const createCategory = async (input: ICategoryInput): Promise<ICategoryResponse> => {
    const admin = await verifyAdministrator();
    if (!admin) return { success: false, error: 'Unauthorized' };
    if (!input.name?.trim()) return { success: false, error: 'Name is required' };
    if (!input.domainId) return { success: false, error: 'Domain is required' };
    try {
        const domain = await prisma.domain.findUnique({ where: { id: input.domainId } });
        if (!domain) return { success: false, error: 'Domain not found' };
        const slug = generateSlug(input.name);
        const existing = await prisma.category.findUnique({ where: { slug } });
        if (existing) return { success: false, error: 'Category with this name already exists' };
        const category = await prisma.category.create({ data: { name: input.name.trim(), slug, description: input.description?.trim(), icon: input.icon, domainId: input.domainId, parentId: input.parentId, order: input.order ?? 0 } });
        return { success: true, data: { id: category.id } };
    } catch (error) { console.error('createCategory error:', error); return { success: false, error: 'Failed to create category' }; }
};

export const updateCategory = async (id: string, input: Partial<Omit<ICategoryInput, 'domainId'>>): Promise<ICategoryResponse> => {
    const admin = await verifyAdministrator();
    if (!admin) return { success: false, error: 'Unauthorized' };
    try {
        const existing = await prisma.category.findUnique({ where: { id } });
        if (!existing) return { success: false, error: 'Category not found' };
        const updateData: Record<string, unknown> = {};
        if (input.name !== undefined) { updateData.name = input.name.trim(); updateData.slug = generateSlug(input.name); }
        if (input.description !== undefined) updateData.description = input.description.trim();
        if (input.icon !== undefined) updateData.icon = input.icon;
        if (input.order !== undefined) updateData.order = input.order;
        if (input.parentId !== undefined) updateData.parentId = input.parentId;
        await prisma.category.update({ where: { id }, data: updateData });
        return { success: true, data: { id } };
    } catch (error) { console.error('updateCategory error:', error); return { success: false, error: 'Failed to update category' }; }
};

export const deleteCategory = async (id: string): Promise<ICategoryResponse> => {
    const admin = await verifyAdministrator();
    if (!admin) return { success: false, error: 'Unauthorized' };
    try {
        const category = await prisma.category.findUnique({ where: { id }, include: { _count: { select: { contents: true, children: true } } } });
        if (!category) return { success: false, error: 'Category not found' };
        if (category._count.contents > 0) return { success: false, error: `Cannot delete: ${category._count.contents} content items exist` };
        if (category._count.children > 0) return { success: false, error: `Cannot delete: ${category._count.children} subcategories exist` };
        await prisma.category.delete({ where: { id } });
        return { success: true, data: { id } };
    } catch (error) { console.error('deleteCategory error:', error); return { success: false, error: 'Failed to delete category' }; }
};

// =============================================
// Topic Types
// =============================================

interface ITopicInput { name: string; description?: string }
interface ITopicResponse { success: boolean; data?: { id: string }; error?: string }
interface ITopicListResponse { success: boolean; data?: Array<{ id: string; name: string; slug: string; description?: string; _count: { contents: number; followers: number }; createdAt: Date }>; error?: string }

// =============================================
// Topic Actions
// =============================================

export const getTopicList = async (): Promise<ITopicListResponse> => {
    const admin = await verifyAdministrator();
    if (!admin) return { success: false, error: 'Unauthorized' };
    try {
        const data = await prisma.topic.findMany({ orderBy: { name: 'asc' }, include: { _count: { select: { contents: true, followers: true } } } });
        return { success: true, data: data as ITopicListResponse['data'] };
    } catch (error) { console.error('getTopicList error:', error); return { success: false, error: 'Failed to fetch topics' }; }
};

export const createTopic = async (input: ITopicInput): Promise<ITopicResponse> => {
    const admin = await verifyAdministrator();
    if (!admin) return { success: false, error: 'Unauthorized' };
    if (!input.name?.trim()) return { success: false, error: 'Name is required' };
    try {
        const slug = generateSlug(input.name);
        const existing = await prisma.topic.findUnique({ where: { slug } });
        if (existing) return { success: false, error: 'Topic with this name already exists' };
        const topic = await prisma.topic.create({ data: { name: input.name.trim(), slug, description: input.description?.trim() } });
        return { success: true, data: { id: topic.id } };
    } catch (error) { console.error('createTopic error:', error); return { success: false, error: 'Failed to create topic' }; }
};

export const updateTopic = async (id: string, input: Partial<ITopicInput>): Promise<ITopicResponse> => {
    const admin = await verifyAdministrator();
    if (!admin) return { success: false, error: 'Unauthorized' };
    try {
        const existing = await prisma.topic.findUnique({ where: { id } });
        if (!existing) return { success: false, error: 'Topic not found' };
        const updateData: Record<string, unknown> = {};
        if (input.name !== undefined) { updateData.name = input.name.trim(); updateData.slug = generateSlug(input.name); }
        if (input.description !== undefined) updateData.description = input.description.trim();
        await prisma.topic.update({ where: { id }, data: updateData });
        return { success: true, data: { id } };
    } catch (error) { console.error('updateTopic error:', error); return { success: false, error: 'Failed to update topic' }; }
};

export const deleteTopic = async (id: string): Promise<ITopicResponse> => {
    const admin = await verifyAdministrator();
    if (!admin) return { success: false, error: 'Unauthorized' };
    try {
        const topic = await prisma.topic.findUnique({ where: { id }, include: { _count: { select: { contents: true } } } });
        if (!topic) return { success: false, error: 'Topic not found' };
        if (topic._count.contents > 0) return { success: false, error: `Cannot delete: ${topic._count.contents} content items use this topic` };
        await prisma.topic.delete({ where: { id } });
        return { success: true, data: { id } };
    } catch (error) { console.error('deleteTopic error:', error); return { success: false, error: 'Failed to delete topic' }; }
};

'use server';

// =============================================
// Search Actions - Content search for users
// =============================================

import { type ContentType } from '@/constants/content.constants';
import { prisma } from '@/server/db/prisma';

// =============================================
// Types
// =============================================

export interface ISearchResult {
    id: string;
    title: string;
    type: ContentType | 'COURSE' | 'SERIES';
    slug: string;
    excerpt?: string;
    thumbnailUrl?: string;
}

interface ISearchResponse {
    success: boolean;
    data?: {
        results: Array<ISearchResult>;
        total: number;
    };
    error?: string;
}

// =============================================
// Global Search (Content, Courses, Series)
// =============================================

export const globalSearch = async (
    query: string,
    options: { limit?: number; types?: Array<'content' | 'course' | 'series'> } = {},
): Promise<ISearchResponse> => {
    try {
        if (!query.trim()) {
            return { success: true, data: { results: [], total: 0 } };
        }

        const { limit = 10, types = ['content', 'course', 'series'] } = options;
        const searchTerm = query.trim();
        const results: Array<ISearchResult> = [];

        // Search published content
        if (types.includes('content')) {
            const contentResults = await prisma.content.findMany({
                where: {
                    status: 'PUBLISHED',
                    OR: [
                        { title: { contains: searchTerm, mode: 'insensitive' } },
                        { slug: { contains: searchTerm, mode: 'insensitive' } },
                        { excerpt: { contains: searchTerm, mode: 'insensitive' } },
                    ],
                },
                select: {
                    id: true,
                    title: true,
                    type: true,
                    slug: true,
                    excerpt: true,
                    thumbnailUrl: true,
                },
                take: limit,
                orderBy: [
                    { viewCount: 'desc' },
                    { createdAt: 'desc' },
                ],
            });

            results.push(
                ...contentResults.map((c) => ({
                    id: c.id,
                    title: c.title,
                    type: c.type as ContentType,
                    slug: c.slug,
                    excerpt: c.excerpt ?? undefined,
                    thumbnailUrl: c.thumbnailUrl ?? undefined,
                })),
            );
        }

        // Search published courses
        if (types.includes('course')) {
            const courseResults = await prisma.course.findMany({
                where: {
                    status: 'PUBLISHED',
                    OR: [
                        { title: { contains: searchTerm, mode: 'insensitive' } },
                        { slug: { contains: searchTerm, mode: 'insensitive' } },
                        { description: { contains: searchTerm, mode: 'insensitive' } },
                    ],
                },
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    description: true,
                    thumbnailUrl: true,
                },
                take: limit,
                orderBy: { createdAt: 'desc' },
            });

            results.push(
                ...courseResults.map((c) => ({
                    id: c.id,
                    title: c.title,
                    type: 'COURSE' as const,
                    slug: c.slug,
                    excerpt: c.description ?? undefined,
                    thumbnailUrl: c.thumbnailUrl ?? undefined,
                })),
            );
        }

        // Search series
        if (types.includes('series')) {
            const seriesResults = await prisma.series.findMany({
                where: {
                    OR: [
                        { title: { contains: searchTerm, mode: 'insensitive' } },
                        { slug: { contains: searchTerm, mode: 'insensitive' } },
                        { description: { contains: searchTerm, mode: 'insensitive' } },
                    ],
                },
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    description: true,
                    thumbnailUrl: true,
                },
                take: limit,
                orderBy: { createdAt: 'desc' },
            });

            results.push(
                ...seriesResults.map((s) => ({
                    id: s.id,
                    title: s.title,
                    type: 'SERIES' as const,
                    slug: s.slug,
                    excerpt: s.description ?? undefined,
                    thumbnailUrl: s.thumbnailUrl ?? undefined,
                })),
            );
        }

        // Sort by relevance (title match first, then others)
        const sortedResults = results.sort((a, b) => {
            const aStartsWith = a.title.toLowerCase().startsWith(searchTerm.toLowerCase());
            const bStartsWith = b.title.toLowerCase().startsWith(searchTerm.toLowerCase());
            if (aStartsWith && !bStartsWith) return -1;
            if (!aStartsWith && bStartsWith) return 1;
            return 0;
        });

        return {
            success: true,
            data: {
                results: sortedResults.slice(0, limit),
                total: sortedResults.length,
            },
        };
    } catch (error) {
        console.error('[globalSearch] Error:', error);
        return {
            success: false,
            error: 'Search failed. Please try again.',
        };
    }
};

// =============================================
// Quick Search (Content only - faster)
// =============================================

export const quickSearch = async (query: string, limit: number = 5): Promise<ISearchResponse> => {
    try {
        if (!query.trim() || query.length < 2) {
            return { success: true, data: { results: [], total: 0 } };
        }

        const searchTerm = query.trim();

        const results = await prisma.content.findMany({
            where: {
                status: 'PUBLISHED',
                title: { contains: searchTerm, mode: 'insensitive' },
            },
            select: {
                id: true,
                title: true,
                type: true,
                slug: true,
                excerpt: true,
            },
            take: limit,
            orderBy: { viewCount: 'desc' },
        });

        return {
            success: true,
            data: {
                results: results.map((c) => ({
                    id: c.id,
                    title: c.title,
                    type: c.type as ContentType,
                    slug: c.slug,
                    excerpt: c.excerpt ?? undefined,
                })),
                total: results.length,
            },
        };
    } catch (error) {
        console.error('[quickSearch] Error:', error);
        return { success: false, error: 'Search failed' };
    }
};

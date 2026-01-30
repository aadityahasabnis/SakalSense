'use server';

// =============================================
// Content Status Actions - Publish, Archive, Unpublish
// =============================================

import { STAKEHOLDER } from '@/constants/auth.constants';
import { getCurrentUser } from '@/lib/auth';
import { type IApiResponse } from '@/lib/interfaces';
import { prisma } from '@/server/db/prisma';

// =============================================
// Publish Content
// =============================================

export const publishContent = async (
    id: string,
): Promise<IApiResponse<{ id: string }>> => {
    try {
        // Authentication check
        const user = await getCurrentUser(STAKEHOLDER.ADMIN);
        if (!user) {
            return {
                success: false,
                error: 'Unauthorized - Admin access required',
            };
        }

        // Check if content exists and belongs to user
        const existingContent = await prisma.content.findFirst({
            where: {
                id,
                creatorId: user.userId,
            },
            select: {
                id: true,
                title: true,
                status: true,
            },
        });

        if (!existingContent) {
            return {
                success: false,
                error: 'Content not found or you don\'t have permission to publish it',
            };
        }

        if (existingContent.status === 'PUBLISHED') {
            return {
                success: false,
                error: 'Content is already published',
            };
        }

        // Publish content
        await prisma.content.update({
            where: { id },
            data: {
                status: 'PUBLISHED',
                publishedAt: new Date(),
            },
        });

        return {
            success: true,
            data: { id },
            message: `"${existingContent.title}" has been published successfully`,
        };
    } catch (error) {
        console.error('[publishContent] Error:', error);
        return {
            success: false,
            error: 'Failed to publish content. Please try again.',
        };
    }
};

// =============================================
// Archive Content
// =============================================

export const archiveContent = async (
    id: string,
): Promise<IApiResponse<{ id: string }>> => {
    try {
        // Authentication check
        const user = await getCurrentUser(STAKEHOLDER.ADMIN);
        if (!user) {
            return {
                success: false,
                error: 'Unauthorized - Admin access required',
            };
        }

        // Check if content exists and belongs to user
        const existingContent = await prisma.content.findFirst({
            where: {
                id,
                creatorId: user.userId,
            },
            select: {
                id: true,
                title: true,
                status: true,
            },
        });

        if (!existingContent) {
            return {
                success: false,
                error: 'Content not found or you don\'t have permission to archive it',
            };
        }

        if (existingContent.status === 'ARCHIVED') {
            return {
                success: false,
                error: 'Content is already archived',
            };
        }

        // Archive content
        await prisma.content.update({
            where: { id },
            data: {
                status: 'ARCHIVED',
            },
        });

        return {
            success: true,
            data: { id },
            message: `"${existingContent.title}" has been archived successfully`,
        };
    } catch (error) {
        console.error('[archiveContent] Error:', error);
        return {
            success: false,
            error: 'Failed to archive content. Please try again.',
        };
    }
};

// =============================================
// Unpublish Content (Move back to Draft)
// =============================================

export const unpublishContent = async (
    id: string,
): Promise<IApiResponse<{ id: string }>> => {
    try {
        // Authentication check
        const user = await getCurrentUser(STAKEHOLDER.ADMIN);
        if (!user) {
            return {
                success: false,
                error: 'Unauthorized - Admin access required',
            };
        }

        // Check if content exists and belongs to user
        const existingContent = await prisma.content.findFirst({
            where: {
                id,
                creatorId: user.userId,
            },
            select: {
                id: true,
                title: true,
                status: true,
            },
        });

        if (!existingContent) {
            return {
                success: false,
                error: 'Content not found or you don\'t have permission to unpublish it',
            };
        }

        if (existingContent.status === 'DRAFT') {
            return {
                success: false,
                error: 'Content is already a draft',
            };
        }

        // Move to draft
        await prisma.content.update({
            where: { id },
            data: {
                status: 'DRAFT',
            },
        });

        return {
            success: true,
            data: { id },
            message: `"${existingContent.title}" has been moved to drafts`,
        };
    } catch (error) {
        console.error('[unpublishContent] Error:', error);
        return {
            success: false,
            error: 'Failed to unpublish content. Please try again.',
        };
    }
};

'use server';
// =============================================
// Practice Actions - For browsing and solving practice problems
// =============================================

import { STAKEHOLDER } from '@/constants/auth.constants';
import { type DifficultyType } from '@/constants/content.constants';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/server/db/prisma';

// =============================================
// Response Types
// =============================================

interface IPracticeListItem {
    id: string;
    title: string;
    slug: string;
    description: string | null;
    status: string;
    isStandalone: boolean;
    createdAt: Date;
    creator: { fullName: string; avatarLink: string | null };
    _count: { sections: number };
    problemCount: number;
}

interface IPracticeListResponse {
    success: boolean;
    data?: Array<IPracticeListItem>;
    total?: number;
    error?: string;
}

interface IPracticeWithDetails {
    id: string;
    title: string;
    slug: string;
    description: string | null;
    creator: { id: string; fullName: string; avatarLink: string | null };
    sections: Array<{
        id: string;
        title: string;
        order: number;
        problems: Array<{
            id: string;
            title: string;
            difficulty: string;
            order: number;
        }>;
    }>;
}

interface IPracticeResponse {
    success: boolean;
    data?: IPracticeWithDetails;
    error?: string;
}

interface IProblemDetails {
    id: string;
    title: string;
    description: string;
    difficulty: string;
    starterCode: string | null;
    hints: unknown;
    section: { title: string; practice: { title: string; slug: string } };
}

interface IProblemResponse {
    success: boolean;
    data?: IProblemDetails;
    error?: string;
}

// =============================================
// Get Published Practices (Public Browse)
// =============================================

export const getPublishedPractices = async (filters: {
    search?: string;
    difficulty?: DifficultyType;
    page?: number;
    limit?: number;
    sortBy?: 'latest' | 'popular' | 'title';
}): Promise<IPracticeListResponse> => {
    try {
        const { search = '', page = 1, limit = 12, sortBy = 'latest' } = filters;

        const where = {
            status: 'PUBLISHED',
            isStandalone: true,
            ...(search && {
                OR: [
                    { title: { contains: search, mode: 'insensitive' as const } },
                    { description: { contains: search, mode: 'insensitive' as const } },
                ],
            }),
        };

        // Determine sort order
        const orderBy: Record<string, 'asc' | 'desc'> =
            sortBy === 'title' ? { title: 'asc' } :
            { createdAt: 'desc' };

        const [data, total] = await Promise.all([
            prisma.practice.findMany({
                where,
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    description: true,
                    status: true,
                    isStandalone: true,
                    createdAt: true,
                    creator: {
                        select: {
                            fullName: true,
                            avatarLink: true,
                        },
                    },
                    _count: {
                        select: { sections: true },
                    },
                    sections: {
                        select: {
                            _count: { select: { problems: true } },
                        },
                    },
                },
                orderBy,
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.practice.count({ where }),
        ]);

        // Transform to add problem count
        const transformed = data.map((p) => ({
            ...p,
            problemCount: p.sections.reduce((acc, s) => acc + s._count.problems, 0),
            sections: undefined,
        }));

        return { success: true, data: transformed as unknown as Array<IPracticeListItem>, total };
    } catch (error) {
        console.error('getPublishedPractices error:', error);
        return { success: false, error: 'Failed to fetch practices' };
    }
};

// =============================================
// Get Practice by Slug (Public View)
// =============================================

export const getPracticeBySlug = async (slug: string): Promise<IPracticeResponse> => {
    try {
        const practice = await prisma.practice.findFirst({
            where: { slug, status: 'PUBLISHED' },
            include: {
                creator: {
                    select: { id: true, fullName: true, avatarLink: true },
                },
                sections: {
                    orderBy: { order: 'asc' },
                    include: {
                        problems: {
                            orderBy: { order: 'asc' },
                            select: {
                                id: true,
                                title: true,
                                difficulty: true,
                                order: true,
                            },
                        },
                    },
                },
            },
        });

        if (!practice) return { success: false, error: 'Practice not found' };

        return { success: true, data: practice as unknown as IPracticeWithDetails };
    } catch (error) {
        console.error('getPracticeBySlug error:', error);
        return { success: false, error: 'Failed to fetch practice' };
    }
};

// =============================================
// Get Problem Details
// =============================================

export const getProblemById = async (problemId: string): Promise<IProblemResponse> => {
    try {
        const problem = await prisma.practiceProblem.findUnique({
            where: { id: problemId },
            include: {
                section: {
                    select: {
                        title: true,
                        practice: {
                            select: { title: true, slug: true, status: true },
                        },
                    },
                },
            },
        });

        if (!problem || problem.section.practice.status !== 'PUBLISHED') {
            return { success: false, error: 'Problem not found' };
        }

        // Don't expose solution to the client
        const { solution, testCases, ...safeData } = problem;

        return { success: true, data: safeData as unknown as IProblemDetails };
    } catch (error) {
        console.error('getProblemById error:', error);
        return { success: false, error: 'Failed to fetch problem' };
    }
};

// =============================================
// Submit Solution (Requires Auth)
// =============================================

interface ISubmissionResult {
    status: 'PASSED' | 'FAILED' | 'PARTIAL';
    passedTests: number;
    totalTests: number;
    message?: string;
}

interface ISubmissionResponse {
    success: boolean;
    data?: ISubmissionResult;
    error?: string;
}

export const submitSolution = async (
    problemId: string,
    code: string
): Promise<ISubmissionResponse> => {
    try {
        const user = await getCurrentUser(STAKEHOLDER.USER);
        if (!user) return { success: false, error: 'Please log in to submit solutions' };

        const problem = await prisma.practiceProblem.findUnique({
            where: { id: problemId },
            select: { testCases: true, solution: true },
        });

        if (!problem) return { success: false, error: 'Problem not found' };

        // For now, simple validation - in production, this would run against a code execution service
        // This is a placeholder - real implementation would use a sandboxed code runner
        const testCases = (problem.testCases as Array<{ input: string; expected: string }>) || [];
        const totalTests = testCases.length;
        const passedTests = totalTests; // Placeholder - would be actual test results

        const status: 'PASSED' | 'FAILED' | 'PARTIAL' = 
            passedTests === totalTests ? 'PASSED' :
            passedTests > 0 ? 'PARTIAL' : 'FAILED';

        // Record submission
        await prisma.practiceSubmission.create({
            data: {
                problemId,
                userId: user.userId,
                code,
                status,
                passedTests,
                totalTests,
            },
        });

        return {
            success: true,
            data: { status, passedTests, totalTests },
        };
    } catch (error) {
        console.error('submitSolution error:', error);
        return { success: false, error: 'Failed to submit solution' };
    }
};

// =============================================
// Get User's Submissions for a Problem
// =============================================

interface IUserSubmission {
    id: string;
    status: string;
    passedTests: number;
    totalTests: number;
    submittedAt: Date;
}

interface IUserSubmissionsResponse {
    success: boolean;
    data?: Array<IUserSubmission>;
    error?: string;
}

export const getUserSubmissions = async (problemId: string): Promise<IUserSubmissionsResponse> => {
    try {
        const user = await getCurrentUser(STAKEHOLDER.USER);
        if (!user) return { success: true, data: [] };

        const submissions = await prisma.practiceSubmission.findMany({
            where: { problemId, userId: user.userId },
            select: {
                id: true,
                status: true,
                passedTests: true,
                totalTests: true,
                submittedAt: true,
            },
            orderBy: { submittedAt: 'desc' },
            take: 10,
        });

        return { success: true, data: submissions as Array<IUserSubmission> };
    } catch (error) {
        console.error('getUserSubmissions error:', error);
        return { success: false, error: 'Failed to fetch submissions' };
    }
};

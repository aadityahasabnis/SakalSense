'use server';
// =============================================
// Practice Actions - For browsing and solving practice problems
// =============================================

import { STAKEHOLDER } from '@/constants/auth.constants';
import { type DifficultyType } from '@/constants/content.constants';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/server/db/prisma';
import { awardXPForProblemSolved } from '@/server/actions/gamification/xpActions';

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
    xpAwarded?: number;
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
            select: { testCases: true, solution: true, difficulty: true },
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

        // Award XP if solution passed (first time only - handled by awardXP function)
        let xpAwarded = 0;
        if (status === 'PASSED') {
            // Determine difficulty category for XP
            const normalizedDifficulty = problem.difficulty.toUpperCase();
            let difficultyForXP: 'EASY' | 'MEDIUM' | 'HARD' = 'MEDIUM';
            
            if (['BEGINNER', 'EASY'].includes(normalizedDifficulty)) {
                difficultyForXP = 'EASY';
            } else if (['INTERMEDIATE', 'MEDIUM'].includes(normalizedDifficulty)) {
                difficultyForXP = 'MEDIUM';
            } else if (['ADVANCED', 'HARD', 'EXPERT'].includes(normalizedDifficulty)) {
                difficultyForXP = 'HARD';
            }

            const xpResult = await awardXPForProblemSolved(problemId, difficultyForXP);
            if (xpResult.success && xpResult.data) {
                xpAwarded = xpResult.data.xpAwarded;
            }
        }

        return {
            success: true,
            data: { status, passedTests, totalTests, xpAwarded },
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

// =============================================
// Get User's Practice Stats (Dashboard/Profile)
// =============================================

interface IPracticeStats {
    totalProblems: number;
    solvedProblems: number;
    totalSubmissions: number;
    successRate: number;
    byDifficulty: {
        BEGINNER: { solved: number; total: number };
        INTERMEDIATE: { solved: number; total: number };
        ADVANCED: { solved: number; total: number };
    };
    recentActivity: {
        lastWeek: number;
        lastMonth: number;
    };
}

interface IPracticeStatsResponse {
    success: boolean;
    data?: IPracticeStats;
    error?: string;
}

export const getUserPracticeStats = async (): Promise<IPracticeStatsResponse> => {
    try {
        const user = await getCurrentUser(STAKEHOLDER.USER);
        if (!user) return { success: false, error: 'Please log in to view stats' };

        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        // Run queries in parallel
        const [
            totalProblems,
            totalSubmissions,
            passedSubmissions,
            solvedProblemIds,
            problemsByDifficulty,
            lastWeekSubmissions,
            lastMonthSubmissions,
        ] = await Promise.all([
            // Total problems available (in published practices)
            prisma.practiceProblem.count({
                where: {
                    section: {
                        practice: { status: 'PUBLISHED' },
                    },
                },
            }),
            // Total submissions by user
            prisma.practiceSubmission.count({
                where: { userId: user.userId },
            }),
            // Passed submissions
            prisma.practiceSubmission.count({
                where: { userId: user.userId, status: 'PASSED' },
            }),
            // Unique problems solved (PASSED status)
            prisma.practiceSubmission.findMany({
                where: { userId: user.userId, status: 'PASSED' },
                select: { problemId: true },
                distinct: ['problemId'],
            }),
            // Problems grouped by difficulty
            prisma.practiceProblem.groupBy({
                by: ['difficulty'],
                where: {
                    section: {
                        practice: { status: 'PUBLISHED' },
                    },
                },
                _count: { id: true },
            }),
            // Submissions in last week
            prisma.practiceSubmission.count({
                where: {
                    userId: user.userId,
                    status: 'PASSED',
                    submittedAt: { gte: oneWeekAgo },
                },
            }),
            // Submissions in last month
            prisma.practiceSubmission.count({
                where: {
                    userId: user.userId,
                    status: 'PASSED',
                    submittedAt: { gte: oneMonthAgo },
                },
            }),
        ]);

        const solvedProblemIdSet = new Set(solvedProblemIds.map((s) => s.problemId));

        // Get solved counts by difficulty
        const solvedByDifficulty = await prisma.practiceProblem.findMany({
            where: {
                id: { in: Array.from(solvedProblemIdSet) },
            },
            select: { difficulty: true },
        });

        const solvedDifficultyCount: Record<string, number> = {};
        solvedByDifficulty.forEach((p) => {
            const diff = p.difficulty.toUpperCase();
            solvedDifficultyCount[diff] = (solvedDifficultyCount[diff] || 0) + 1;
        });

        // Build difficulty stats
        const difficultyTotals: Record<string, number> = {};
        (problemsByDifficulty as Array<{ difficulty: string; _count: { id: number } }>).forEach((g) => {
            difficultyTotals[g.difficulty.toUpperCase()] = g._count.id;
        });

        const byDifficulty = {
            BEGINNER: {
                solved: solvedDifficultyCount['BEGINNER'] || 0,
                total: difficultyTotals['BEGINNER'] || 0,
            },
            INTERMEDIATE: {
                solved: solvedDifficultyCount['INTERMEDIATE'] || 0,
                total: difficultyTotals['INTERMEDIATE'] || 0,
            },
            ADVANCED: {
                solved: solvedDifficultyCount['ADVANCED'] || 0,
                total: difficultyTotals['ADVANCED'] || 0,
            },
        };

        const successRate = totalSubmissions > 0 
            ? Math.round((passedSubmissions / totalSubmissions) * 100) 
            : 0;

        return {
            success: true,
            data: {
                totalProblems,
                solvedProblems: solvedProblemIdSet.size,
                totalSubmissions,
                successRate,
                byDifficulty,
                recentActivity: {
                    lastWeek: lastWeekSubmissions,
                    lastMonth: lastMonthSubmissions,
                },
            },
        };
    } catch (error) {
        console.error('getUserPracticeStats error:', error);
        return { success: false, error: 'Failed to fetch practice stats' };
    }
};

// =============================================
// Get All User Submissions (Paginated History)
// =============================================

interface ISubmissionHistoryItem {
    id: string;
    status: string;
    passedTests: number;
    totalTests: number;
    submittedAt: Date;
    problem: {
        id: string;
        title: string;
        difficulty: string;
        section: {
            title: string;
            practice: {
                title: string;
                slug: string;
            };
        };
    };
}

interface ISubmissionHistoryResponse {
    success: boolean;
    data?: Array<ISubmissionHistoryItem>;
    total?: number;
    error?: string;
}

export const getAllUserSubmissions = async (filters: {
    status?: 'PASSED' | 'FAILED' | 'PARTIAL';
    difficulty?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
    page?: number;
    limit?: number;
}): Promise<ISubmissionHistoryResponse> => {
    try {
        const user = await getCurrentUser(STAKEHOLDER.USER);
        if (!user) return { success: false, error: 'Please log in to view submissions' };

        const { status, difficulty, page = 1, limit = 20 } = filters;

        const where = {
            userId: user.userId,
            ...(status && { status }),
            ...(difficulty && {
                problem: {
                    difficulty: { equals: difficulty, mode: 'insensitive' as const },
                },
            }),
        };

        const [submissions, total] = await Promise.all([
            prisma.practiceSubmission.findMany({
                where,
                select: {
                    id: true,
                    status: true,
                    passedTests: true,
                    totalTests: true,
                    submittedAt: true,
                    problem: {
                        select: {
                            id: true,
                            title: true,
                            difficulty: true,
                            section: {
                                select: {
                                    title: true,
                                    practice: {
                                        select: {
                                            title: true,
                                            slug: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                orderBy: { submittedAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.practiceSubmission.count({ where }),
        ]);

        return {
            success: true,
            data: submissions as unknown as Array<ISubmissionHistoryItem>,
            total,
        };
    } catch (error) {
        console.error('getAllUserSubmissions error:', error);
        return { success: false, error: 'Failed to fetch submission history' };
    }
};

// =============================================
// Get Problem Solve Status for a Practice Set
// =============================================

interface IProblemSolveStatus {
    problemId: string;
    solved: boolean;
    attempts: number;
    bestStatus: string | null;
}

interface IProblemSolveStatusResponse {
    success: boolean;
    data?: Array<IProblemSolveStatus>;
    error?: string;
}

export const getProblemSolveStatus = async (
    practiceSlug: string
): Promise<IProblemSolveStatusResponse> => {
    try {
        const user = await getCurrentUser(STAKEHOLDER.USER);
        if (!user) return { success: true, data: [] };

        // Get all problems in this practice
        const practice = await prisma.practice.findFirst({
            where: { slug: practiceSlug, status: 'PUBLISHED' },
            select: {
                sections: {
                    select: {
                        problems: {
                            select: { id: true },
                        },
                    },
                },
            },
        });

        if (!practice) return { success: false, error: 'Practice not found' };

        const problemIds = practice.sections.flatMap((s) =>
            s.problems.map((p) => p.id)
        );

        if (problemIds.length === 0) return { success: true, data: [] };

        // Get user's submissions for these problems
        const submissions = await prisma.practiceSubmission.findMany({
            where: {
                userId: user.userId,
                problemId: { in: problemIds },
            },
            select: {
                problemId: true,
                status: true,
            },
        });

        // Build status map
        const statusMap = new Map<string, { attempts: number; statuses: string[] }>();
        for (const sub of submissions) {
            let entry = statusMap.get(sub.problemId);
            if (!entry) {
                entry = { attempts: 0, statuses: [] };
                statusMap.set(sub.problemId, entry);
            }
            entry.attempts++;
            entry.statuses.push(sub.status);
        }

        // Determine best status for each problem
        const statusPriority = { PASSED: 3, PARTIAL: 2, FAILED: 1 };
        const result: Array<IProblemSolveStatus> = problemIds.map((problemId) => {
            const data = statusMap.get(problemId);
            if (!data || data.statuses.length === 0) {
                return { problemId, solved: false, attempts: 0, bestStatus: null };
            }

            const bestStatus = data.statuses.reduce((best, curr) => {
                const bestPriority = statusPriority[best as keyof typeof statusPriority] || 0;
                const currPriority = statusPriority[curr as keyof typeof statusPriority] || 0;
                return currPriority > bestPriority ? curr : best;
            }, data.statuses[0]) ?? null;

            return {
                problemId,
                solved: bestStatus === 'PASSED',
                attempts: data.attempts,
                bestStatus,
            };
        });

        return { success: true, data: result };
    } catch (error) {
        console.error('getProblemSolveStatus error:', error);
        return { success: false, error: 'Failed to fetch solve status' };
    }
};

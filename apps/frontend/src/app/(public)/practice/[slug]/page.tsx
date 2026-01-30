// =============================================
// Practice Detail Page - Server Component
// =============================================

import { STAKEHOLDER } from '@/constants/auth.constants';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/server/db/prisma';
import { type Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PracticeDetailClient } from './PracticeDetailClient';

// =============================================
// Dynamic Metadata
// =============================================

export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string }>;
}): Promise<Metadata> {
    const { slug } = await params;

    const practice = await prisma.practice.findFirst({
        where: { slug, status: 'PUBLISHED' },
        select: { title: true, description: true },
    });

    if (!practice) {
        return { title: 'Practice Not Found' };
    }

    return {
        title: `${practice.title} | Practice - SakalSense`,
        description: practice.description ?? `Practice problems for ${practice.title}`,
    };
}

// =============================================
// Page Component
// =============================================

export default async function PracticeDetailPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const user = await getCurrentUser(STAKEHOLDER.USER);

    // Fetch practice with sections and problems
    const practice = await prisma.practice.findFirst({
        where: { slug, status: 'PUBLISHED' },
        include: {
            creator: {
                select: {
                    id: true,
                    fullName: true,
                    avatarLink: true,
                },
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

    if (!practice) {
        notFound();
    }

    // Get user's solved problems
    let solvedProblemIds: string[] = [];
    let problemStats: { easy: number; medium: number; hard: number } = { easy: 0, medium: 0, hard: 0 };

    if (user) {
        // Get all problem IDs from this practice
        const allProblemIds = practice.sections.flatMap(s => s.problems.map(p => p.id));

        // Get problems that user has passed
        const solvedSubmissions = await prisma.practiceSubmission.findMany({
            where: {
                userId: user.userId,
                problemId: { in: allProblemIds },
                status: 'PASSED',
            },
            select: { problemId: true },
            distinct: ['problemId'],
        });

        solvedProblemIds = solvedSubmissions.map(s => s.problemId);
    }

    // Calculate stats
    const totalProblems = practice.sections.reduce((acc, s) => acc + s.problems.length, 0);
    const difficultyCount = { BEGINNER: 0, EASY: 0, INTERMEDIATE: 0, MEDIUM: 0, ADVANCED: 0, HARD: 0, EXPERT: 0 };
    
    practice.sections.forEach(section => {
        section.problems.forEach(problem => {
            const diff = problem.difficulty.toUpperCase();
            if (diff in difficultyCount) {
                difficultyCount[diff as keyof typeof difficultyCount]++;
            }
        });
    });

    // Normalize difficulty labels
    const easyCount = difficultyCount.BEGINNER + difficultyCount.EASY;
    const mediumCount = difficultyCount.INTERMEDIATE + difficultyCount.MEDIUM;
    const hardCount = difficultyCount.ADVANCED + difficultyCount.HARD + difficultyCount.EXPERT;

    return (
        <PracticeDetailClient
            practice={{
                id: practice.id,
                title: practice.title,
                slug: practice.slug,
                description: practice.description ?? undefined,
                creator: practice.creator,
                sections: practice.sections.map(section => ({
                    id: section.id,
                    title: section.title,
                    order: section.order,
                    problems: section.problems.map(problem => ({
                        id: problem.id,
                        title: problem.title,
                        difficulty: problem.difficulty,
                        order: problem.order,
                        isSolved: solvedProblemIds.includes(problem.id),
                    })),
                })),
            }}
            stats={{
                totalProblems,
                solvedCount: solvedProblemIds.length,
                easyCount,
                mediumCount,
                hardCount,
            }}
            isLoggedIn={!!user}
        />
    );
}

// =============================================
// Problem Solving Page - Server Component
// =============================================

import { notFound } from 'next/navigation';

import { STAKEHOLDER } from '@/constants/auth.constants';
import { getCurrentUser } from '@/lib/auth';
import { getProblemById, getUserSubmissions } from '@/server/actions/content/practiceActions';

import { ProblemSolvingClient } from './ProblemSolvingClient';

interface IPageProps {
    params: Promise<{ slug: string; problemId: string }>;
}

export default async function ProblemSolvingPage({ params }: IPageProps) {
    const { slug, problemId } = await params;

    // Fetch problem data and user submissions in parallel
    const [problemResult, submissionsResult, user] = await Promise.all([
        getProblemById(problemId),
        getUserSubmissions(problemId),
        getCurrentUser(STAKEHOLDER.USER),
    ]);

    if (!problemResult.success || !problemResult.data) {
        notFound();
    }

    const problem = problemResult.data;
    const submissions = submissionsResult.success ? submissionsResult.data ?? [] : [];
    const isSolved = submissions.some((s) => s.status === 'PASSED');

    return (
        <ProblemSolvingClient
            problem={problem}
            practiceSlug={slug}
            submissions={submissions}
            isSolved={isSolved}
            isLoggedIn={!!user}
        />
    );
}

// Generate metadata for the page
export async function generateMetadata({ params }: IPageProps) {
    const { problemId } = await params;
    const result = await getProblemById(problemId);

    if (!result.success || !result.data) {
        return {
            title: 'Problem Not Found | SakalSense',
        };
    }

    return {
        title: `${result.data.title} | Practice | SakalSense`,
        description: `Solve the "${result.data.title}" problem - ${result.data.difficulty} difficulty`,
    };
}

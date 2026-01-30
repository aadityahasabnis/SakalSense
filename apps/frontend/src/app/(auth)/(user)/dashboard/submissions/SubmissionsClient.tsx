'use client';
// =============================================
// SubmissionsClient - Practice Submission History & Stats
// =============================================

import { useState } from 'react';

import Link from 'next/link';

import { useQuery } from '@tanstack/react-query';
import {
    ArrowLeft,
    Calendar,
    CheckCircle2,
    Clock,
    Code2,
    Filter,
    Target,
    Trophy,
    XCircle,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    getAllUserSubmissions,
    getUserPracticeStats,
} from '@/server/actions/content/practiceActions';

// =============================================
// Stats Card Component
// =============================================

interface IStatsCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ReactNode;
    variant?: 'default' | 'success' | 'warning' | 'info';
}

const StatsCard = ({ title, value, subtitle, icon, variant = 'default' }: IStatsCardProps) => {
    const variantStyles = {
        default: 'bg-card',
        success: 'bg-green-500/10 border-green-500/20',
        warning: 'bg-yellow-500/10 border-yellow-500/20',
        info: 'bg-blue-500/10 border-blue-500/20',
    };

    return (
        <Card className={variantStyles[variant]}>
            <CardContent className='flex items-center gap-4 p-4'>
                <div className='rounded-lg bg-muted p-3'>{icon}</div>
                <div>
                    <p className='text-sm text-muted-foreground'>{title}</p>
                    <p className='text-2xl font-bold'>{value}</p>
                    {subtitle && <p className='text-xs text-muted-foreground'>{subtitle}</p>}
                </div>
            </CardContent>
        </Card>
    );
};

// =============================================
// Difficulty Progress Component
// =============================================

interface IDifficultyProgressProps {
    difficulty: string;
    solved: number;
    total: number;
    color: string;
}

const DifficultyProgress = ({ difficulty, solved, total, color }: IDifficultyProgressProps) => {
    const percentage = total > 0 ? Math.round((solved / total) * 100) : 0;

    return (
        <div className='space-y-1'>
            <div className='flex items-center justify-between text-sm'>
                <span className='font-medium'>{difficulty}</span>
                <span className='text-muted-foreground'>
                    {solved}/{total}
                </span>
            </div>
            <div className='h-2 w-full overflow-hidden rounded-full bg-muted'>
                <div
                    className='h-full transition-all duration-500'
                    style={{
                        width: `${percentage}%`,
                        backgroundColor: color,
                    }}
                />
            </div>
        </div>
    );
};

// =============================================
// Status Badge Component
// =============================================

const StatusBadge = ({ status }: { status: string }) => {
    const config = {
        PASSED: {
            label: 'Passed',
            variant: 'default' as const,
            icon: <CheckCircle2 className='h-3 w-3' />,
            className: 'bg-green-500/20 text-green-600 border-green-500/30',
        },
        FAILED: {
            label: 'Failed',
            variant: 'destructive' as const,
            icon: <XCircle className='h-3 w-3' />,
            className: 'bg-red-500/20 text-red-600 border-red-500/30',
        },
        PARTIAL: {
            label: 'Partial',
            variant: 'secondary' as const,
            icon: <Target className='h-3 w-3' />,
            className: 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30',
        },
    };

    const statusConfig = config[status as keyof typeof config] || config.FAILED;

    return (
        <Badge variant='outline' className={`gap-1 ${statusConfig.className}`}>
            {statusConfig.icon}
            {statusConfig.label}
        </Badge>
    );
};

// =============================================
// Difficulty Badge Component
// =============================================

const DifficultyBadge = ({ difficulty }: { difficulty: string }) => {
    const normalizedDiff = difficulty.toUpperCase();
    const config = {
        BEGINNER: { label: 'Beginner', className: 'bg-green-500/20 text-green-600' },
        EASY: { label: 'Easy', className: 'bg-green-500/20 text-green-600' },
        INTERMEDIATE: { label: 'Intermediate', className: 'bg-yellow-500/20 text-yellow-600' },
        MEDIUM: { label: 'Medium', className: 'bg-yellow-500/20 text-yellow-600' },
        ADVANCED: { label: 'Advanced', className: 'bg-red-500/20 text-red-600' },
        HARD: { label: 'Hard', className: 'bg-red-500/20 text-red-600' },
    };

    const diffConfig = config[normalizedDiff as keyof typeof config] || {
        label: difficulty,
        className: 'bg-muted',
    };

    return <Badge variant='outline' className={diffConfig.className}>{diffConfig.label}</Badge>;
};

// =============================================
// Main Component
// =============================================

export const SubmissionsClient = () => {
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
    const pageSize = 15;

    // Fetch stats
    const { data: statsData, isLoading: statsLoading } = useQuery({
        queryKey: ['practice-stats'],
        queryFn: () => getUserPracticeStats(),
        staleTime: 60000, // 1 minute
    });

    // Fetch submissions
    const { data: submissionsData, isLoading: submissionsLoading } = useQuery({
        queryKey: ['user-submissions', page, statusFilter, difficultyFilter],
        queryFn: () =>
            getAllUserSubmissions({
                page,
                limit: pageSize,
                status: statusFilter === 'all' ? undefined : (statusFilter as 'PASSED' | 'FAILED' | 'PARTIAL'),
                difficulty: difficultyFilter === 'all' ? undefined : (difficultyFilter as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'),
            }),
        staleTime: 30000, // 30 seconds
    });

    const stats = statsData?.data;
    const submissions = submissionsData?.data ?? [];
    const totalSubmissions = submissionsData?.total ?? 0;
    const totalPages = Math.ceil(totalSubmissions / pageSize);

    // Format time ago
    const formatTimeAgo = (date: Date) => {
        const now = new Date();
        const diff = now.getTime() - new Date(date).getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return new Date(date).toLocaleDateString();
    };

    // Loading skeleton
    if (statsLoading) {
        return (
            <div className='min-h-screen bg-background'>
                <div className='mx-auto max-w-7xl px-4 py-8'>
                    <Skeleton className='mb-4 h-10 w-64' />
                    <div className='mb-8 grid gap-4 md:grid-cols-4'>
                        {Array.from({ length: 4 }).map((_, i) => (
                            <Skeleton key={i} className='h-24 w-full' />
                        ))}
                    </div>
                    <Skeleton className='h-96 w-full' />
                </div>
            </div>
        );
    }

    return (
        <div className='min-h-screen bg-background'>
            <div className='mx-auto max-w-7xl px-4 py-8'>
                {/* Header */}
                <div className='mb-8'>
                    <div className='mb-4'>
                        <Button variant='ghost' size='sm' asChild>
                            <Link href='/dashboard'>
                                <ArrowLeft className='mr-2 h-4 w-4' />
                                Back to Dashboard
                            </Link>
                        </Button>
                    </div>

                    <div className='flex items-center gap-3'>
                        <Code2 className='h-8 w-8 text-primary' />
                        <div>
                            <h1 className='text-3xl font-bold'>Submission History</h1>
                            <p className='text-sm text-muted-foreground'>
                                Track your practice problem submissions and progress
                            </p>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className='mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
                    <StatsCard
                        title='Problems Solved'
                        value={stats?.solvedProblems ?? 0}
                        subtitle={`of ${stats?.totalProblems ?? 0} problems`}
                        icon={<Trophy className='h-5 w-5 text-yellow-500' />}
                        variant='success'
                    />
                    <StatsCard
                        title='Total Submissions'
                        value={stats?.totalSubmissions ?? 0}
                        icon={<Code2 className='h-5 w-5 text-blue-500' />}
                        variant='info'
                    />
                    <StatsCard
                        title='Success Rate'
                        value={`${stats?.successRate ?? 0}%`}
                        icon={<Target className='h-5 w-5 text-green-500' />}
                    />
                    <StatsCard
                        title='Last 7 Days'
                        value={stats?.recentActivity.lastWeek ?? 0}
                        subtitle={`${stats?.recentActivity.lastMonth ?? 0} this month`}
                        icon={<Calendar className='h-5 w-5 text-purple-500' />}
                    />
                </div>

                {/* Difficulty Breakdown */}
                <div className='mb-8 grid gap-6 md:grid-cols-2'>
                    <Card>
                        <CardHeader>
                            <CardTitle className='text-base'>Progress by Difficulty</CardTitle>
                        </CardHeader>
                        <CardContent className='space-y-4'>
                            <DifficultyProgress
                                difficulty='Beginner'
                                solved={stats?.byDifficulty.BEGINNER.solved ?? 0}
                                total={stats?.byDifficulty.BEGINNER.total ?? 0}
                                color='#22c55e'
                            />
                            <DifficultyProgress
                                difficulty='Intermediate'
                                solved={stats?.byDifficulty.INTERMEDIATE.solved ?? 0}
                                total={stats?.byDifficulty.INTERMEDIATE.total ?? 0}
                                color='#eab308'
                            />
                            <DifficultyProgress
                                difficulty='Advanced'
                                solved={stats?.byDifficulty.ADVANCED.solved ?? 0}
                                total={stats?.byDifficulty.ADVANCED.total ?? 0}
                                color='#ef4444'
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className='text-base'>Quick Stats</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className='space-y-4'>
                                <div className='flex items-center justify-between'>
                                    <span className='text-sm text-muted-foreground'>Completion Rate</span>
                                    <span className='font-semibold'>
                                        {stats && stats.totalProblems > 0
                                            ? Math.round((stats.solvedProblems / stats.totalProblems) * 100)
                                            : 0}%
                                    </span>
                                </div>
                                <div className='flex items-center justify-between'>
                                    <span className='text-sm text-muted-foreground'>Avg Attempts per Problem</span>
                                    <span className='font-semibold'>
                                        {stats && stats.solvedProblems > 0
                                            ? (stats.totalSubmissions / stats.solvedProblems).toFixed(1)
                                            : '-'}
                                    </span>
                                </div>
                                <div className='flex items-center justify-between'>
                                    <span className='text-sm text-muted-foreground'>Problems Left</span>
                                    <span className='font-semibold'>
                                        {(stats?.totalProblems ?? 0) - (stats?.solvedProblems ?? 0)}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <Card className='mb-6'>
                    <CardContent className='flex flex-wrap items-center gap-4 p-4'>
                        <div className='flex items-center gap-2'>
                            <Filter className='h-4 w-4 text-muted-foreground' />
                            <span className='text-sm font-medium'>Filters:</span>
                        </div>

                        <Select
                            value={statusFilter}
                            onValueChange={(value) => {
                                setStatusFilter(value);
                                setPage(1);
                            }}
                        >
                            <SelectTrigger className='w-[140px]'>
                                <SelectValue placeholder='Status' />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value='all'>All Status</SelectItem>
                                <SelectItem value='PASSED'>Passed</SelectItem>
                                <SelectItem value='FAILED'>Failed</SelectItem>
                                <SelectItem value='PARTIAL'>Partial</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select
                            value={difficultyFilter}
                            onValueChange={(value) => {
                                setDifficultyFilter(value);
                                setPage(1);
                            }}
                        >
                            <SelectTrigger className='w-[160px]'>
                                <SelectValue placeholder='Difficulty' />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value='all'>All Difficulties</SelectItem>
                                <SelectItem value='BEGINNER'>Beginner</SelectItem>
                                <SelectItem value='INTERMEDIATE'>Intermediate</SelectItem>
                                <SelectItem value='ADVANCED'>Advanced</SelectItem>
                            </SelectContent>
                        </Select>

                        {(statusFilter !== 'all' || difficultyFilter !== 'all') && (
                            <Button
                                variant='ghost'
                                size='sm'
                                onClick={() => {
                                    setStatusFilter('all');
                                    setDifficultyFilter('all');
                                    setPage(1);
                                }}
                            >
                                Clear filters
                            </Button>
                        )}
                    </CardContent>
                </Card>

                {/* Submissions Table */}
                <Card>
                    <CardHeader>
                        <CardTitle className='flex items-center justify-between'>
                            <span>Recent Submissions</span>
                            <span className='text-sm font-normal text-muted-foreground'>
                                {totalSubmissions} total
                            </span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {submissionsLoading ? (
                            <div className='space-y-4'>
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <Skeleton key={i} className='h-12 w-full' />
                                ))}
                            </div>
                        ) : submissions.length === 0 ? (
                            <div className='py-12 text-center'>
                                <Code2 className='mx-auto mb-4 h-12 w-12 text-muted-foreground' />
                                <h3 className='mb-2 text-lg font-semibold'>No submissions yet</h3>
                                <p className='mb-6 text-sm text-muted-foreground'>
                                    Start solving practice problems to see your submissions here
                                </p>
                                <Button asChild>
                                    <Link href='/practice'>Browse Problems</Link>
                                </Button>
                            </div>
                        ) : (
                            <>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Problem</TableHead>
                                            <TableHead>Practice Set</TableHead>
                                            <TableHead>Difficulty</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Tests</TableHead>
                                            <TableHead className='text-right'>Submitted</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {submissions.map((submission) => (
                                            <TableRow key={submission.id}>
                                                <TableCell className='font-medium'>
                                                    <Link
                                                        href={`/practice/${submission.problem.section.practice.slug}/${submission.problem.id}`}
                                                        className='hover:text-primary hover:underline'
                                                    >
                                                        {submission.problem.title}
                                                    </Link>
                                                </TableCell>
                                                <TableCell className='text-muted-foreground'>
                                                    <Link
                                                        href={`/practice/${submission.problem.section.practice.slug}`}
                                                        className='hover:text-foreground'
                                                    >
                                                        {submission.problem.section.practice.title}
                                                    </Link>
                                                </TableCell>
                                                <TableCell>
                                                    <DifficultyBadge difficulty={submission.problem.difficulty} />
                                                </TableCell>
                                                <TableCell>
                                                    <StatusBadge status={submission.status} />
                                                </TableCell>
                                                <TableCell className='text-muted-foreground'>
                                                    {submission.passedTests}/{submission.totalTests}
                                                </TableCell>
                                                <TableCell className='text-right text-muted-foreground'>
                                                    <div className='flex items-center justify-end gap-1'>
                                                        <Clock className='h-3 w-3' />
                                                        {formatTimeAgo(submission.submittedAt)}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className='mt-6 flex items-center justify-center gap-2'>
                                        <Button
                                            variant='outline'
                                            size='sm'
                                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                                            disabled={page === 1}
                                        >
                                            Previous
                                        </Button>
                                        <span className='text-sm text-muted-foreground'>
                                            Page {page} of {totalPages}
                                        </span>
                                        <Button
                                            variant='outline'
                                            size='sm'
                                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                            disabled={page === totalPages}
                                        >
                                            Next
                                        </Button>
                                    </div>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

'use client';

// =============================================
// Practice Detail Client Component
// =============================================

import {
    ArrowLeft,
    Check,
    CheckCircle2,
    ChevronDown,
    ChevronRight,
    Code2,
    Flame,
    Layers,
    Lock,
    Target,
    Trophy,
    User,
    Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

// =============================================
// Types
// =============================================

interface IProblem {
    id: string;
    title: string;
    difficulty: string;
    order: number;
    isSolved: boolean;
}

interface ISection {
    id: string;
    title: string;
    order: number;
    problems: IProblem[];
}

interface IPractice {
    id: string;
    title: string;
    slug: string;
    description?: string;
    creator: {
        id: string;
        fullName: string;
        avatarLink?: string | null;
    };
    sections: ISection[];
}

interface IStats {
    totalProblems: number;
    solvedCount: number;
    easyCount: number;
    mediumCount: number;
    hardCount: number;
}

interface IPracticeDetailClientProps {
    practice: IPractice;
    stats: IStats;
    isLoggedIn: boolean;
}

// =============================================
// Difficulty Badge Colors
// =============================================

const difficultyColors: Record<string, { bg: string; text: string; border: string }> = {
    BEGINNER: { bg: 'bg-green-500/10', text: 'text-green-600', border: 'border-green-500/20' },
    EASY: { bg: 'bg-green-500/10', text: 'text-green-600', border: 'border-green-500/20' },
    INTERMEDIATE: { bg: 'bg-yellow-500/10', text: 'text-yellow-600', border: 'border-yellow-500/20' },
    MEDIUM: { bg: 'bg-yellow-500/10', text: 'text-yellow-600', border: 'border-yellow-500/20' },
    ADVANCED: { bg: 'bg-orange-500/10', text: 'text-orange-600', border: 'border-orange-500/20' },
    HARD: { bg: 'bg-red-500/10', text: 'text-red-600', border: 'border-red-500/20' },
    EXPERT: { bg: 'bg-purple-500/10', text: 'text-purple-600', border: 'border-purple-500/20' },
};

const getDifficultyLabel = (difficulty: string): string => {
    const normalized = difficulty.toUpperCase();
    if (['BEGINNER', 'EASY'].includes(normalized)) return 'Easy';
    if (['INTERMEDIATE', 'MEDIUM'].includes(normalized)) return 'Medium';
    if (['ADVANCED', 'HARD', 'EXPERT'].includes(normalized)) return 'Hard';
    return difficulty;
};

// =============================================
// Main Component
// =============================================

export const PracticeDetailClient = ({
    practice,
    stats,
    isLoggedIn,
}: IPracticeDetailClientProps) => {
    const router = useRouter();
    const [expandedSections, setExpandedSections] = useState<Set<string>>(
        new Set(practice.sections.map(s => s.id))
    );

    const toggleSection = (sectionId: string) => {
        setExpandedSections((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(sectionId)) {
                newSet.delete(sectionId);
            } else {
                newSet.add(sectionId);
            }
            return newSet;
        });
    };

    const handleProblemClick = (problemId: string) => {
        router.push(`/practice/${practice.slug}/problem/${problemId}`);
    };

    const progressPercent = stats.totalProblems > 0
        ? Math.round((stats.solvedCount / stats.totalProblems) * 100)
        : 0;

    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <div className="bg-gradient-to-b from-primary/5 to-background border-b">
                <div className="container mx-auto max-w-6xl px-4 py-12">
                    <div className="grid gap-8 lg:grid-cols-3">
                        {/* Practice Info */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Breadcrumb */}
                            <div className="text-muted-foreground flex items-center gap-2 text-sm">
                                <Link href="/practice" className="hover:text-foreground flex items-center gap-1">
                                    <ArrowLeft className="h-4 w-4" />
                                    Practice
                                </Link>
                                <ChevronRight className="h-4 w-4" />
                                <span className="text-foreground">{practice.title}</span>
                            </div>

                            {/* Title & Description */}
                            <div>
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                                        <Code2 className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <h1 className="text-2xl font-bold lg:text-3xl">{practice.title}</h1>
                                    </div>
                                </div>
                                {practice.description && (
                                    <p className="text-muted-foreground text-lg mt-3">{practice.description}</p>
                                )}
                            </div>

                            {/* Stats */}
                            <div className="flex flex-wrap items-center gap-6">
                                <div className="flex items-center gap-2">
                                    <Target className="text-muted-foreground h-5 w-5" />
                                    <span>{stats.totalProblems} problems</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Layers className="text-muted-foreground h-5 w-5" />
                                    <span>{practice.sections.length} sections</span>
                                </div>
                                {isLoggedIn && stats.solvedCount > 0 && (
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="text-green-500 h-5 w-5" />
                                        <span>{stats.solvedCount} solved</span>
                                    </div>
                                )}
                            </div>

                            {/* Difficulty Distribution */}
                            <div className="flex flex-wrap items-center gap-3">
                                {stats.easyCount > 0 && (
                                    <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                                        Easy: {stats.easyCount}
                                    </Badge>
                                )}
                                {stats.mediumCount > 0 && (
                                    <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                                        Medium: {stats.mediumCount}
                                    </Badge>
                                )}
                                {stats.hardCount > 0 && (
                                    <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20">
                                        Hard: {stats.hardCount}
                                    </Badge>
                                )}
                            </div>

                            {/* Creator */}
                            <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={practice.creator.avatarLink ?? undefined} />
                                    <AvatarFallback>
                                        {practice.creator.fullName.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="text-sm text-muted-foreground">Created by</p>
                                    <p className="font-medium">{practice.creator.fullName}</p>
                                </div>
                            </div>
                        </div>

                        {/* Progress Card */}
                        <div className="lg:col-span-1">
                            <Card className="sticky top-20 shadow-lg">
                                <CardContent className="p-6 space-y-6">
                                    {/* Progress */}
                                    {isLoggedIn ? (
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <h3 className="font-semibold">Your Progress</h3>
                                                <span className="text-2xl font-bold">{progressPercent}%</span>
                                            </div>
                                            <Progress value={progressPercent} className="h-3" />
                                            <p className="text-sm text-muted-foreground">
                                                {stats.solvedCount} of {stats.totalProblems} problems solved
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="text-center py-4">
                                            <Lock className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                                            <p className="font-medium">Track Your Progress</p>
                                            <p className="text-sm text-muted-foreground mb-4">
                                                Log in to save your progress and earn XP
                                            </p>
                                            <Button onClick={() => router.push(`/login?redirect=/practice/${practice.slug}`)}>
                                                Log In
                                            </Button>
                                        </div>
                                    )}

                                    <Separator />

                                    {/* XP Info */}
                                    <div className="space-y-3">
                                        <h3 className="font-semibold flex items-center gap-2">
                                            <Zap className="h-4 w-4 text-yellow-500" />
                                            Earn XP
                                        </h3>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex items-center justify-between">
                                                <span className="text-muted-foreground">Easy Problem</span>
                                                <span className="font-medium">+10 XP</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-muted-foreground">Medium Problem</span>
                                                <span className="font-medium">+25 XP</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-muted-foreground">Hard Problem</span>
                                                <span className="font-medium">+50 XP</span>
                                            </div>
                                        </div>
                                    </div>

                                    <Separator />

                                    {/* Achievements */}
                                    <div className="space-y-3">
                                        <h3 className="font-semibold flex items-center gap-2">
                                            <Trophy className="h-4 w-4 text-yellow-500" />
                                            Achievements
                                        </h3>
                                        <div className="grid grid-cols-3 gap-2">
                                            <div className="text-center p-2 rounded-lg bg-muted/50">
                                                <Flame className="h-5 w-5 mx-auto text-orange-500 mb-1" />
                                                <p className="text-xs text-muted-foreground">Streak</p>
                                            </div>
                                            <div className="text-center p-2 rounded-lg bg-muted/50">
                                                <Target className="h-5 w-5 mx-auto text-blue-500 mb-1" />
                                                <p className="text-xs text-muted-foreground">Solver</p>
                                            </div>
                                            <div className="text-center p-2 rounded-lg bg-muted/50">
                                                <Trophy className="h-5 w-5 mx-auto text-yellow-500 mb-1" />
                                                <p className="text-xs text-muted-foreground">Master</p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>

            {/* Problems List */}
            <div className="container mx-auto max-w-6xl px-4 py-12">
                <div className="lg:grid lg:grid-cols-3 lg:gap-8">
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Code2 className="h-5 w-5" />
                                    Problems
                                </CardTitle>
                                <p className="text-muted-foreground text-sm">
                                    {practice.sections.length} sections • {stats.totalProblems} problems
                                </p>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {practice.sections.map((section) => {
                                    const sectionSolvedCount = section.problems.filter(p => p.isSolved).length;
                                    const sectionCompleted = sectionSolvedCount === section.problems.length;

                                    return (
                                        <div key={section.id} className="rounded-lg border">
                                            {/* Section Header */}
                                            <button
                                                className="flex w-full items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                                                onClick={() => toggleSection(section.id)}
                                            >
                                                <div className="flex items-center gap-3">
                                                    {expandedSections.has(section.id) ? (
                                                        <ChevronDown className="h-5 w-5" />
                                                    ) : (
                                                        <ChevronRight className="h-5 w-5" />
                                                    )}
                                                    <div className="text-left">
                                                        <h3 className="font-medium">{section.title}</h3>
                                                        <p className="text-muted-foreground text-sm">
                                                            {sectionSolvedCount}/{section.problems.length} solved
                                                        </p>
                                                    </div>
                                                </div>
                                                {sectionCompleted && isLoggedIn && (
                                                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                                                )}
                                            </button>

                                            {/* Problems */}
                                            {expandedSections.has(section.id) && (
                                                <div className="border-t bg-muted/20">
                                                    {section.problems.map((problem, index) => {
                                                        const diffColors = difficultyColors[problem.difficulty.toUpperCase()] 
                                                            ?? difficultyColors.MEDIUM;
                                                        
                                                        return (
                                                            <button
                                                                key={problem.id}
                                                                className="flex w-full items-center gap-4 px-4 py-3 hover:bg-muted/50 transition-colors text-left"
                                                                onClick={() => handleProblemClick(problem.id)}
                                                            >
                                                                {/* Problem Number */}
                                                                <div className={cn(
                                                                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                                                                    problem.isSolved
                                                                        ? 'bg-green-500/10'
                                                                        : 'bg-muted',
                                                                )}>
                                                                    {problem.isSolved ? (
                                                                        <Check className="h-4 w-4 text-green-500" />
                                                                    ) : (
                                                                        <span className="text-sm font-medium">
                                                                            {index + 1}
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                {/* Problem Info */}
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="font-medium truncate">{problem.title}</p>
                                                                </div>

                                                                {/* Difficulty Badge */}
                                                                <Badge
                                                                    variant="outline"
                                                                    className={cn(
                                                                        'shrink-0',
                                                                        diffColors.bg,
                                                                        diffColors.text,
                                                                        diffColors.border,
                                                                    )}
                                                                >
                                                                    {getDifficultyLabel(problem.difficulty)}
                                                                </Badge>

                                                                {/* XP indicator */}
                                                                <div className="flex items-center gap-1 text-sm text-muted-foreground shrink-0">
                                                                    <Zap className="h-3.5 w-3.5 text-yellow-500" />
                                                                    <span>
                                                                        {['BEGINNER', 'EASY'].includes(problem.difficulty.toUpperCase())
                                                                            ? '10'
                                                                            : ['ADVANCED', 'HARD', 'EXPERT'].includes(problem.difficulty.toUpperCase())
                                                                            ? '50'
                                                                            : '25'}
                                                                    </span>
                                                                </div>

                                                                {/* Arrow */}
                                                                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar for large screens - Quick Stats */}
                    <div className="hidden lg:block">
                        <Card className="sticky top-20">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Target className="h-5 w-5" />
                                    Quick Stats
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Difficulty Breakdown */}
                                <div className="space-y-3">
                                    <h4 className="text-sm font-medium text-muted-foreground">Difficulty Breakdown</h4>
                                    
                                    {stats.easyCount > 0 && (
                                        <div className="space-y-1">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-green-600">Easy</span>
                                                <span>{stats.easyCount}</span>
                                            </div>
                                            <div className="h-2 rounded-full bg-muted overflow-hidden">
                                                <div
                                                    className="h-full bg-green-500 transition-all"
                                                    style={{ width: `${(stats.easyCount / stats.totalProblems) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                    
                                    {stats.mediumCount > 0 && (
                                        <div className="space-y-1">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-yellow-600">Medium</span>
                                                <span>{stats.mediumCount}</span>
                                            </div>
                                            <div className="h-2 rounded-full bg-muted overflow-hidden">
                                                <div
                                                    className="h-full bg-yellow-500 transition-all"
                                                    style={{ width: `${(stats.mediumCount / stats.totalProblems) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                    
                                    {stats.hardCount > 0 && (
                                        <div className="space-y-1">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-red-600">Hard</span>
                                                <span>{stats.hardCount}</span>
                                            </div>
                                            <div className="h-2 rounded-full bg-muted overflow-hidden">
                                                <div
                                                    className="h-full bg-red-500 transition-all"
                                                    style={{ width: `${(stats.hardCount / stats.totalProblems) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <Separator />

                                {/* Potential XP */}
                                <div className="space-y-2">
                                    <h4 className="text-sm font-medium text-muted-foreground">Potential XP</h4>
                                    <div className="flex items-center gap-2">
                                        <Zap className="h-5 w-5 text-yellow-500" />
                                        <span className="text-2xl font-bold">
                                            {stats.easyCount * 10 + stats.mediumCount * 25 + stats.hardCount * 50}
                                        </span>
                                        <span className="text-muted-foreground">XP</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Solve all problems to earn this XP
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

'use client';

// =============================================
// User Dashboard Client - Personalized Dashboard
// =============================================

import { useQuery } from '@tanstack/react-query';
import {
    ArrowRight,
    BookOpen,
    Calendar,
    CheckCircle2,
    Code,
    Flame,
    GraduationCap,
    Lightbulb,
    Play,
    Sparkles,
    Target,
    Trophy,
    TrendingUp,
    Zap,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useMemo } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
    getDashboardData,
    type IContinueLearningItem,
    type IDashboardData,
    type IRecentActivity,
    type IRecommendation,
} from '@/server/actions/dashboard/dashboardActions';

// =============================================
// Props
// =============================================

interface DashboardClientProps {
    userId: string;
}

// =============================================
// Main Component
// =============================================

export function DashboardClient({ userId }: DashboardClientProps) {
    const { data, isLoading, error } = useQuery({
        queryKey: ['dashboard', userId],
        queryFn: async () => {
            const result = await getDashboardData();
            if (!result.success || !result.data) {
                throw new Error(result.error ?? 'Failed to load dashboard');
            }
            return result.data;
        },
        staleTime: 1000 * 60 * 2, // 2 minutes
        refetchOnWindowFocus: true,
    });

    if (isLoading) {
        return <DashboardSkeleton />;
    }

    if (error || !data) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <p className="text-muted-foreground">Failed to load dashboard</p>
                <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
                    Retry
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Welcome Section */}
            <WelcomeSection user={data.user} stats={data.stats} />

            {/* Main Grid */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Left Column - Main Content */}
                <div className="space-y-6 lg:col-span-2">
                    {/* Daily Progress */}
                    <DailyProgressCard progress={data.dailyProgress} streak={data.stats.currentStreak} />

                    {/* Continue Learning */}
                    <ContinueLearningSection items={data.continueLearning} />

                    {/* Recommendations */}
                    <RecommendationsSection items={data.recommendations} />
                </div>

                {/* Right Column - Sidebar */}
                <div className="space-y-6">
                    {/* XP Stats Card */}
                    <XPStatsCard stats={data.stats} />

                    {/* Activity Calendar (Compact) */}
                    <ActivityCalendarCard activities={data.activityCalendar} />

                    {/* Recent Activity */}
                    <RecentActivityCard activities={data.recentActivity} />
                </div>
            </div>
        </div>
    );
}

// =============================================
// Welcome Section
// =============================================

function WelcomeSection({ user, stats }: { user: IDashboardData['user']; stats: IDashboardData['stats'] }) {
    const greeting = useMemo(() => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    }, []);

    const firstName = user.fullName.split(' ')[0];

    return (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14 border-2 border-primary/20">
                    <AvatarImage src={user.avatarLink ?? undefined} alt={user.fullName} />
                    <AvatarFallback className="text-lg">{user.fullName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        {greeting}, {firstName}!
                    </h1>
                    <p className="text-muted-foreground">
                        {stats.currentStreak > 0 ? (
                            <span className="flex items-center gap-1">
                                <Flame className="h-4 w-4 text-orange-500" />
                                {stats.currentStreak} day streak - Keep it going!
                            </span>
                        ) : (
                            "Let's start learning today!"
                        )}
                    </p>
                </div>
            </div>
            <div className="flex gap-2">
                <Button asChild variant="outline">
                    <Link href="/courses">
                        <GraduationCap className="mr-2 h-4 w-4" />
                        Browse Courses
                    </Link>
                </Button>
                <Button asChild>
                    <Link href="/practice">
                        <Code className="mr-2 h-4 w-4" />
                        Practice
                    </Link>
                </Button>
            </div>
        </div>
    );
}

// =============================================
// Daily Progress Card
// =============================================

function DailyProgressCard({
    progress,
    streak,
}: {
    progress: IDashboardData['dailyProgress'];
    streak: number;
}) {
    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Target className="h-5 w-5 text-primary" />
                            Today&apos;s Progress
                        </CardTitle>
                        <CardDescription>Your daily learning goals</CardDescription>
                    </div>
                    {progress.goalMet && (
                        <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20">
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Goal Met!
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {/* XP Progress */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-1 text-muted-foreground">
                                <Zap className="h-4 w-4 text-yellow-500" />
                                XP Earned
                            </span>
                            <span className="font-medium">
                                {progress.xpEarned}/{progress.xpGoal}
                            </span>
                        </div>
                        <Progress value={progress.xpPercentage} className="h-2" />
                    </div>

                    {/* Content Completed */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-1 text-muted-foreground">
                                <BookOpen className="h-4 w-4 text-blue-500" />
                                Content
                            </span>
                            <span className="font-medium">
                                {progress.contentCompleted}/{progress.contentGoal}
                            </span>
                        </div>
                        <Progress value={progress.contentPercentage} className="h-2" />
                    </div>

                    {/* Lessons */}
                    <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10">
                            <GraduationCap className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{progress.lessonsCompleted}</p>
                            <p className="text-xs text-muted-foreground">Lessons</p>
                        </div>
                    </div>

                    {/* Problems Solved */}
                    <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/10">
                            <Code className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{progress.problemsSolved}</p>
                            <p className="text-xs text-muted-foreground">Problems</p>
                        </div>
                    </div>
                </div>

                {/* Streak Indicator */}
                {streak > 0 && (
                    <div className="mt-4 flex items-center justify-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-4 py-2 dark:border-orange-900/50 dark:bg-orange-950/20">
                        <Flame className="h-5 w-5 text-orange-500" />
                        <span className="text-sm font-medium text-orange-700 dark:text-orange-400">
                            {streak} Day Streak! Keep learning to maintain it.
                        </span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

// =============================================
// XP Stats Card
// =============================================

function XPStatsCard({ stats }: { stats: IDashboardData['stats'] }) {
    return (
        <Card className="bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    Your Progress
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Level Badge */}
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70 text-2xl font-bold text-primary-foreground">
                            {stats.level}
                        </div>
                        <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-yellow-500 text-xs font-bold text-white">
                            <Sparkles className="h-3 w-3" />
                        </div>
                    </div>
                    <div className="flex-1">
                        <p className="font-semibold">Level {stats.level}</p>
                        <p className="text-sm text-muted-foreground">{stats.totalXP.toLocaleString()} XP total</p>
                    </div>
                </div>

                {/* Progress to next level */}
                <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Next level</span>
                        <span className="font-medium">{stats.xpToNextLevel} XP needed</span>
                    </div>
                    <Progress value={stats.progressToNextLevel} className="h-2" />
                    <p className="text-right text-xs text-muted-foreground">{stats.progressToNextLevel}%</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-background/80 p-3 text-center">
                        <p className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                            <Flame className="h-3 w-3 text-orange-500" />
                            Streak
                        </p>
                        <p className="text-lg font-bold">{stats.currentStreak}</p>
                    </div>
                    <div className="rounded-lg bg-background/80 p-3 text-center">
                        <p className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                            <TrendingUp className="h-3 w-3 text-green-500" />
                            Rank
                        </p>
                        <p className="text-lg font-bold">#{stats.rank ?? '-'}</p>
                    </div>
                </div>

                <Button asChild variant="outline" className="w-full">
                    <Link href="/leaderboard">
                        View Leaderboard
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </CardContent>
        </Card>
    );
}

// =============================================
// Continue Learning Section
// =============================================

function ContinueLearningSection({ items }: { items: IContinueLearningItem[] }) {
    if (items.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Play className="h-5 w-5 text-primary" />
                        Continue Learning
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <GraduationCap className="mb-4 h-12 w-12 text-muted-foreground/50" />
                        <p className="mb-2 font-medium">No courses in progress</p>
                        <p className="mb-4 text-sm text-muted-foreground">
                            Start learning by enrolling in a course
                        </p>
                        <Button asChild>
                            <Link href="/courses">Browse Courses</Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                    <CardTitle className="flex items-center gap-2">
                        <Play className="h-5 w-5 text-primary" />
                        Continue Learning
                    </CardTitle>
                    <CardDescription>Pick up where you left off</CardDescription>
                </div>
                <Button asChild variant="ghost" size="sm">
                    <Link href="/dashboard/enrolled">
                        View All
                        <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                </Button>
            </CardHeader>
            <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                    {items.map((item) => (
                        <Link key={item.id} href={item.slug} className="group">
                            <div className="flex gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50">
                                <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-md bg-muted">
                                    {item.thumbnailUrl ? (
                                        <Image
                                            src={item.thumbnailUrl}
                                            alt={item.title}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-full items-center justify-center">
                                            {item.type === 'course' ? (
                                                <GraduationCap className="h-6 w-6 text-muted-foreground" />
                                            ) : (
                                                <BookOpen className="h-6 w-6 text-muted-foreground" />
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-1 flex-col justify-between">
                                    <div>
                                        <p className="line-clamp-1 font-medium group-hover:text-primary">
                                            {item.title}
                                        </p>
                                        <p className="text-xs text-muted-foreground">{item.nextAction}</p>
                                    </div>
                                    <div className="mt-2">
                                        <Progress value={item.progress} className="h-1.5" />
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

// =============================================
// Activity Calendar Card (Compact)
// =============================================

function ActivityCalendarCard({
    activities,
}: {
    activities: IDashboardData['activityCalendar'];
}) {
    // Get last 12 weeks of data
    const last12Weeks = useMemo(() => {
        const today = new Date();
        const weeks: Array<Array<{ date: string; count: number; level: 0 | 1 | 2 | 3 | 4 }>> = [];

        for (let w = 11; w >= 0; w--) {
            const week: Array<{ date: string; count: number; level: 0 | 1 | 2 | 3 | 4 }> = [];
            for (let d = 0; d < 7; d++) {
                const date = new Date(today);
                date.setDate(date.getDate() - (w * 7 + (6 - d)));
                const dateStr = date.toISOString().split('T')[0];
                const activity = activities.find((a) => a.date === dateStr);
                week.push({
                    date: dateStr,
                    count: activity?.count ?? 0,
                    level: activity?.level ?? 0,
                });
            }
            weeks.push(week);
        }

        return weeks;
    }, [activities]);

    const levelColors = [
        'bg-muted',
        'bg-green-200 dark:bg-green-900',
        'bg-green-400 dark:bg-green-700',
        'bg-green-500 dark:bg-green-600',
        'bg-green-600 dark:bg-green-500',
    ];

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                    <Calendar className="h-5 w-5 text-primary" />
                    Activity
                </CardTitle>
                <Button asChild variant="ghost" size="sm">
                    <Link href="/profile">
                        Full View
                        <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                </Button>
            </CardHeader>
            <CardContent>
                <TooltipProvider delayDuration={0}>
                    <div className="flex justify-center gap-[3px]">
                        {last12Weeks.map((week, weekIndex) => (
                            <div key={weekIndex} className="flex flex-col gap-[3px]">
                                {week.map((day) => (
                                    <Tooltip key={day.date}>
                                        <TooltipTrigger asChild>
                                            <div
                                                className={`h-[10px] w-[10px] rounded-[2px] ${levelColors[day.level]}`}
                                            />
                                        </TooltipTrigger>
                                        <TooltipContent side="top">
                                            <p className="text-xs">
                                                <span className="font-medium">{day.count} contributions</span>
                                                <br />
                                                {new Date(day.date).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric',
                                                })}
                                            </p>
                                        </TooltipContent>
                                    </Tooltip>
                                ))}
                            </div>
                        ))}
                    </div>
                </TooltipProvider>

                {/* Legend */}
                <div className="mt-3 flex items-center justify-end gap-1 text-xs text-muted-foreground">
                    <span>Less</span>
                    {levelColors.map((color, i) => (
                        <div key={i} className={`h-[10px] w-[10px] rounded-[2px] ${color}`} />
                    ))}
                    <span>More</span>
                </div>
            </CardContent>
        </Card>
    );
}

// =============================================
// Recent Activity Card
// =============================================

function RecentActivityCard({ activities }: { activities: IRecentActivity[] }) {
    const getActivityIcon = (type: IRecentActivity['type']) => {
        switch (type) {
            case 'LESSON_COMPLETED':
                return <GraduationCap className="h-4 w-4 text-green-500" />;
            case 'PROBLEM_SOLVED':
                return <Code className="h-4 w-4 text-purple-500" />;
            case 'CONTENT_READ':
                return <BookOpen className="h-4 w-4 text-blue-500" />;
            case 'ACHIEVEMENT_UNLOCKED':
                return <Trophy className="h-4 w-4 text-yellow-500" />;
            case 'COURSE_ENROLLED':
                return <GraduationCap className="h-4 w-4 text-primary" />;
            default:
                return <Zap className="h-4 w-4 text-yellow-500" />;
        }
    };

    const formatTimeAgo = (date: Date) => {
        const now = new Date();
        const diffMs = now.getTime() - new Date(date).getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Recent Activity
                </CardTitle>
            </CardHeader>
            <CardContent>
                {activities.length === 0 ? (
                    <p className="py-4 text-center text-sm text-muted-foreground">
                        No recent activity. Start learning to see your progress here!
                    </p>
                ) : (
                    <div className="space-y-3">
                        {activities.slice(0, 6).map((activity) => (
                            <div
                                key={activity.id}
                                className="flex items-start gap-3 text-sm"
                            >
                                <div className="mt-0.5 rounded-full bg-muted p-1.5">
                                    {getActivityIcon(activity.type)}
                                </div>
                                <div className="flex-1 space-y-0.5">
                                    <p className="line-clamp-2 leading-tight">{activity.description}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {formatTimeAgo(activity.createdAt)}
                                        {activity.xp && activity.xp > 0 && (
                                            <span className="ml-2 text-yellow-600 dark:text-yellow-500">
                                                +{activity.xp} XP
                                            </span>
                                        )}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

// =============================================
// Recommendations Section
// =============================================

function RecommendationsSection({ items }: { items: IRecommendation[] }) {
    if (items.length === 0) return null;

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty.toUpperCase()) {
            case 'BEGINNER':
                return 'bg-green-500/10 text-green-600';
            case 'INTERMEDIATE':
                return 'bg-yellow-500/10 text-yellow-600';
            case 'ADVANCED':
                return 'bg-red-500/10 text-red-600';
            default:
                return 'bg-muted text-muted-foreground';
        }
    };

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-yellow-500" />
                    Recommended for You
                </CardTitle>
                <CardDescription>Based on your learning history and interests</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {items.map((item) => (
                        <Link key={item.id} href={item.slug} className="group">
                            <div className="overflow-hidden rounded-lg border transition-colors hover:border-primary/50">
                                <div className="relative aspect-video bg-muted">
                                    {item.thumbnailUrl ? (
                                        <Image
                                            src={item.thumbnailUrl}
                                            alt={item.title}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-full items-center justify-center">
                                            {item.type === 'course' ? (
                                                <GraduationCap className="h-8 w-8 text-muted-foreground" />
                                            ) : item.type === 'practice' ? (
                                                <Code className="h-8 w-8 text-muted-foreground" />
                                            ) : (
                                                <BookOpen className="h-8 w-8 text-muted-foreground" />
                                            )}
                                        </div>
                                    )}
                                    <div className="absolute right-2 top-2">
                                        <Badge variant="secondary" className="text-xs">
                                            {item.reason}
                                        </Badge>
                                    </div>
                                </div>
                                <div className="p-3">
                                    <p className="line-clamp-2 font-medium group-hover:text-primary">
                                        {item.title}
                                    </p>
                                    <div className="mt-2 flex items-center gap-2">
                                        <Badge className={`text-xs ${getDifficultyColor(item.difficulty)}`}>
                                            {item.difficulty}
                                        </Badge>
                                        <Badge variant="outline" className="text-xs capitalize">
                                            {item.type}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

// =============================================
// Loading Skeleton
// =============================================

function DashboardSkeleton() {
    return (
        <div className="space-y-6">
            {/* Welcome skeleton */}
            <div className="flex items-center gap-4">
                <Skeleton className="h-14 w-14 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-32" />
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="space-y-6 lg:col-span-2">
                    {/* Daily progress skeleton */}
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-6 w-40" />
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 sm:grid-cols-4">
                                {[1, 2, 3, 4].map((i) => (
                                    <Skeleton key={i} className="h-16 w-full" />
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Continue learning skeleton */}
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-6 w-40" />
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 sm:grid-cols-2">
                                {[1, 2].map((i) => (
                                    <Skeleton key={i} className="h-24 w-full" />
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    {/* XP card skeleton */}
                    <Card>
                        <CardContent className="pt-6">
                            <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <Skeleton className="h-16 w-16 rounded-full" />
                                    <div className="space-y-2">
                                        <Skeleton className="h-5 w-20" />
                                        <Skeleton className="h-4 w-24" />
                                    </div>
                                </div>
                                <Skeleton className="h-2 w-full" />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Activity calendar skeleton */}
                    <Card>
                        <CardContent className="pt-6">
                            <Skeleton className="h-[100px] w-full" />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

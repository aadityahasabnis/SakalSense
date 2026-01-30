'use client';
// =============================================
// DashboardClient - User home dashboard
// =============================================

import Link from 'next/link';

import { useQuery } from '@tanstack/react-query';
import {
    ArrowRight,
    Bookmark,
    BookOpen,
    Compass,
    GraduationCap,
    History,
    TrendingUp,
    Trophy,
    User,
    Zap
} from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { type ICurrentUser } from '@/lib/auth';
import {
    getUserProfile,
    getUserReadingHistory,
    getUserStatsSummary
} from '@/server/actions/user/profileActions';

interface IDashboardClientProps {
    user: ICurrentUser;
}

export const DashboardClient = ({ user }: IDashboardClientProps) => {
    // Fetch profile
    const { data: profileData, isLoading: profileLoading } = useQuery({
        queryKey: ['user-profile', user.userId],
        queryFn: getUserProfile,
        staleTime: 60000,
    });

    // Fetch stats
    const { data: statsData, isLoading: statsLoading } = useQuery({
        queryKey: ['user-stats', user.userId],
        queryFn: getUserStatsSummary,
        staleTime: 60000,
    });

    // Fetch recent reading
    const { data: historyData, isLoading: historyLoading } = useQuery({
        queryKey: ['user-history', user.userId, 1, 3],
        queryFn: () => getUserReadingHistory({ page: 1, limit: 3 }),
        staleTime: 60000,
    });

    const profile = profileData?.data;
    const stats = statsData?.data;
    const history = historyData?.data?.history ?? [];

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    };

    return (
        <div className="min-h-screen bg-background">
            <div className="mx-auto max-w-6xl px-4 py-8">
                {/* Welcome Header */}
                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16">
                            <AvatarImage src={user.avatarLink ?? undefined} alt={user.fullName} />
                            <AvatarFallback className="text-xl">{getInitials(user.fullName)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <h1 className="text-2xl font-bold">
                                {getGreeting()}, {user.fullName.split(' ')[0]}!
                            </h1>
                            <p className="text-muted-foreground">
                                Ready to continue learning?
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" asChild>
                            <Link href="/profile">
                                <User className="mr-2 h-4 w-4" />
                                Profile
                            </Link>
                        </Button>
                        <Button asChild>
                            <Link href="/explore">
                                <Compass className="mr-2 h-4 w-4" />
                                Explore
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Stats Overview */}
                <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        icon={Zap}
                        label="Current Streak"
                        value={profile?.stats.currentStreak ?? 0}
                        suffix="days"
                        loading={profileLoading}
                        color="text-orange-500"
                    />
                    <StatCard
                        icon={BookOpen}
                        label="Content Read"
                        value={stats?.contentRead ?? 0}
                        suffix="articles"
                        loading={statsLoading}
                        color="text-blue-500"
                    />
                    <StatCard
                        icon={GraduationCap}
                        label="Courses Enrolled"
                        value={profile?.stats.coursesEnrolled ?? 0}
                        suffix="courses"
                        loading={profileLoading}
                        color="text-green-500"
                    />
                    <StatCard
                        icon={TrendingUp}
                        label="Time This Week"
                        value={stats?.totalTimeSpent ?? 0}
                        suffix="mins"
                        loading={statsLoading}
                        color="text-purple-500"
                    />
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Continue Reading */}
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <History className="h-5 w-5" />
                                        Continue Reading
                                    </CardTitle>
                                    <CardDescription>Pick up where you left off</CardDescription>
                                </div>
                                <Button variant="ghost" size="sm" asChild>
                                    <Link href="/dashboard/history">
                                        View All
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                            </CardHeader>
                            <CardContent>
                                {historyLoading ? (
                                    <div className="space-y-3">
                                        {Array.from({ length: 3 }).map((_, i) => (
                                            <Skeleton key={i} className="h-20 w-full" />
                                        ))}
                                    </div>
                                ) : history.length > 0 ? (
                                    <div className="space-y-3">
                                        {history.map((item) => (
                                            <Link
                                                key={item.id}
                                                href={`/content/${item.content.slug}`}
                                                className="flex items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50"
                                            >
                                                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                                                    <BookOpen className="h-6 w-6 text-primary" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium truncate">{item.content.title}</p>
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                        <Badge variant="outline" className="text-xs">
                                                            {item.content.type}
                                                        </Badge>
                                                        <span>
                                                            {item.isCompleted ? 'Completed' : `${item.progress}% complete`}
                                                        </span>
                                                    </div>
                                                </div>
                                                {!item.isCompleted && (
                                                    <div className="hidden sm:block">
                                                        <div className="h-2 w-24 rounded-full bg-muted">
                                                            <div
                                                                className="h-2 rounded-full bg-primary"
                                                                style={{ width: `${item.progress}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                                {item.isCompleted && (
                                                    <Badge variant="default">Done</Badge>
                                                )}
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="rounded-lg border border-dashed p-8 text-center">
                                        <BookOpen className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                                        <p className="font-medium">No reading history yet</p>
                                        <p className="mb-4 text-sm text-muted-foreground">
                                            Start exploring content to build your history
                                        </p>
                                        <Button asChild>
                                            <Link href="/explore">Start Reading</Link>
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Quick Links */}
                    <div className="space-y-6">
                        {/* Streak Card */}
                        <Card className="bg-gradient-to-br from-orange-500/10 to-yellow-500/10">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-4">
                                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-500/20">
                                        <Zap className="h-8 w-8 text-orange-500" />
                                    </div>
                                    <div>
                                        {profileLoading ? (
                                            <>
                                                <Skeleton className="mb-1 h-8 w-16" />
                                                <Skeleton className="h-4 w-24" />
                                            </>
                                        ) : (
                                            <>
                                                <p className="text-3xl font-bold">
                                                    {profile?.stats.currentStreak ?? 0}
                                                </p>
                                                <p className="text-sm text-muted-foreground">Day streak</p>
                                            </>
                                        )}
                                    </div>
                                    <div className="ml-auto text-right">
                                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                            <Trophy className="h-4 w-4 text-yellow-500" />
                                            Best: {profile?.stats.longestStreak ?? 0}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Quick Actions */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Quick Links</CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-2">
                                <QuickLink
                                    href="/dashboard/bookmarks"
                                    icon={Bookmark}
                                    label="My Bookmarks"
                                    count={profile?.stats.bookmarksCount}
                                />
                                <QuickLink
                                    href="/explore"
                                    icon={Compass}
                                    label="Explore Content"
                                />
                                <QuickLink
                                    href="/profile"
                                    icon={User}
                                    label="Edit Profile"
                                />
                            </CardContent>
                        </Card>

                        {/* Weekly Activity */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">This Week</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {statsLoading ? (
                                    <div className="flex gap-1">
                                        {Array.from({ length: 7 }).map((_, i) => (
                                            <Skeleton key={i} className="h-8 flex-1" />
                                        ))}
                                    </div>
                                ) : stats?.thisWeekActivity ? (
                                    <div className="flex gap-1">
                                        {stats.thisWeekActivity.map((day) => {
                                            const intensity = day.count === 0 ? 0 : day.count <= 2 ? 1 : day.count <= 5 ? 2 : 3;
                                            const bgColors = [
                                                'bg-muted',
                                                'bg-green-200 dark:bg-green-900',
                                                'bg-green-400 dark:bg-green-700',
                                                'bg-green-600 dark:bg-green-500',
                                            ];
                                            const dayName = new Date(day.date).toLocaleDateString('en-US', { weekday: 'narrow' });

                                            return (
                                                <div
                                                    key={day.date}
                                                    className="flex flex-1 flex-col items-center gap-1"
                                                    title={`${day.count} activities`}
                                                >
                                                    <div className={`h-8 w-full rounded ${bgColors[intensity]}`} />
                                                    <span className="text-[10px] text-muted-foreground">{dayName}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">No activity data</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

// =============================================
// Helper Components
// =============================================

const StatCard = ({
    icon: Icon,
    label,
    value,
    suffix,
    loading,
    color
}: {
    icon: React.ElementType;
    label: string;
    value: number;
    suffix: string;
    loading: boolean;
    color: string;
}) => (
    <Card>
        <CardContent className="pt-6">
            <div className="flex items-center gap-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-lg bg-muted ${color}`}>
                    <Icon className="h-6 w-6" />
                </div>
                <div>
                    {loading ? (
                        <>
                            <Skeleton className="mb-1 h-6 w-12" />
                            <Skeleton className="h-4 w-20" />
                        </>
                    ) : (
                        <>
                            <p className="text-2xl font-bold">{value}</p>
                            <p className="text-sm text-muted-foreground">{label}</p>
                        </>
                    )}
                </div>
            </div>
        </CardContent>
    </Card>
);

const QuickLink = ({
    href,
    icon: Icon,
    label,
    count
}: {
    href: string;
    icon: React.ElementType;
    label: string;
    count?: number;
}) => (
    <Link
        href={href}
        className="flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-muted"
    >
        <Icon className="h-5 w-5 text-muted-foreground" />
        <span className="flex-1 text-sm font-medium">{label}</span>
        {count !== undefined && (
            <Badge variant="secondary">{count}</Badge>
        )}
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
    </Link>
);

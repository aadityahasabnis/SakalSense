'use client';

// =============================================
// Leaderboard Client Component
// =============================================

import { useQuery } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import {
    Crown,
    Flame,
    TrendingUp,
    Trophy,
    Zap,
} from 'lucide-react';
import { useState } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { userIdAtom } from '@/jotai/atoms';
import { cn } from '@/lib/utils';
import { getLeaderboard, getUserXP, type ILeaderboardEntry, type IUserXPData } from '@/server/actions/gamification/xpActions';

// =============================================
// Types
// =============================================

type LeaderboardPeriod = 'weekly' | 'monthly' | 'allTime';

// =============================================
// Leaderboard Client Component
// =============================================

export const LeaderboardClient = () => {
    const [period, setPeriod] = useState<LeaderboardPeriod>('weekly');
    const currentUserId = useAtomValue(userIdAtom);

    // Fetch leaderboard data
    const { data: leaderboardData, isLoading: isLoadingLeaderboard } = useQuery({
        queryKey: ['leaderboard', period],
        queryFn: async () => {
            const result = await getLeaderboard(period, 100);
            if (!result.success) throw new Error(result.error);
            return result.data;
        },
    });

    // Fetch current user's XP
    const { data: userXP, isLoading: isLoadingXP } = useQuery({
        queryKey: ['userXP'],
        queryFn: async () => {
            const result = await getUserXP();
            if (!result.success) throw new Error(result.error);
            return result.data;
        },
    });

    const periodLabels: Record<LeaderboardPeriod, string> = {
        weekly: 'This Week',
        monthly: 'This Month',
        allTime: 'All Time',
    };

    return (
        <div className="container mx-auto max-w-6xl space-y-8 px-4 py-8">
            {/* Header */}
            <div className="text-center">
                <h1 className="mb-2 text-3xl font-bold">Leaderboard</h1>
                <p className="text-muted-foreground">
                    Compete with other learners and climb to the top!
                </p>
            </div>

            {/* Current User Stats */}
            {currentUserId && (
                <UserStatsCard
                    userXP={userXP ?? null}
                    currentUserRank={leaderboardData?.currentUserRank ?? null}
                    period={periodLabels[period]}
                    isLoading={isLoadingXP}
                />
            )}

            {/* Period Tabs */}
            <Tabs value={period} onValueChange={(v) => setPeriod(v as LeaderboardPeriod)}>
                <div className="flex justify-center">
                    <TabsList className="grid w-full max-w-md grid-cols-3">
                        <TabsTrigger value="weekly" className="gap-2">
                            <Flame className="h-4 w-4" />
                            Weekly
                        </TabsTrigger>
                        <TabsTrigger value="monthly" className="gap-2">
                            <TrendingUp className="h-4 w-4" />
                            Monthly
                        </TabsTrigger>
                        <TabsTrigger value="allTime" className="gap-2">
                            <Trophy className="h-4 w-4" />
                            All Time
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value={period} className="mt-6">
                    {isLoadingLeaderboard ? (
                        <LeaderboardSkeleton />
                    ) : leaderboardData?.entries.length === 0 ? (
                        <EmptyLeaderboard />
                    ) : (
                        <>
                            {/* Top 3 Podium */}
                            <TopThreePodium entries={leaderboardData?.entries.slice(0, 3) ?? []} />

                            {/* Rest of Leaderboard */}
                            <div className="mt-8 space-y-2">
                                {leaderboardData?.entries.slice(3).map((entry) => (
                                    <LeaderboardRow
                                        key={entry.userId}
                                        entry={entry}
                                        isCurrentUser={entry.userId === currentUserId}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
};

// =============================================
// User Stats Card
// =============================================

interface IUserStatsCardProps {
    userXP: IUserXPData | null;
    currentUserRank: number | null;
    period: string;
    isLoading: boolean;
}

const UserStatsCard = ({ userXP, currentUserRank, period, isLoading }: IUserStatsCardProps) => {
    if (isLoading) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center gap-6">
                        <Skeleton className="h-16 w-16 rounded-full" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-6 w-32" />
                            <Skeleton className="h-4 w-48" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!userXP) return null;

    return (
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
            <CardContent className="p-6">
                <div className="flex flex-col items-center gap-6 md:flex-row">
                    {/* Rank Badge */}
                    <div className="flex flex-col items-center">
                        <div className="bg-primary/10 flex h-20 w-20 items-center justify-center rounded-full">
                            {currentUserRank && currentUserRank <= 3 ? (
                                <Crown className={cn(
                                    'h-10 w-10',
                                    currentUserRank === 1 && 'text-yellow-500',
                                    currentUserRank === 2 && 'text-gray-400',
                                    currentUserRank === 3 && 'text-amber-600',
                                )} />
                            ) : (
                                <span className="text-primary text-2xl font-bold">
                                    #{currentUserRank ?? '-'}
                                </span>
                            )}
                        </div>
                        <span className="text-muted-foreground mt-1 text-sm">Your Rank</span>
                    </div>

                    {/* XP Stats */}
                    <div className="flex-1 text-center md:text-left">
                        <div className="mb-2 flex items-center justify-center gap-2 md:justify-start">
                            <Zap className="h-5 w-5 text-yellow-500" />
                            <span className="text-2xl font-bold">{userXP.totalXP.toLocaleString()} XP</span>
                            <Badge variant="secondary">Level {userXP.level}</Badge>
                        </div>
                        <div className="mb-2">
                            <div className="text-muted-foreground mb-1 flex justify-between text-sm">
                                <span>Progress to Level {userXP.level + 1}</span>
                                <span>{userXP.xpToNextLevel} XP needed</span>
                            </div>
                            <Progress value={userXP.progressToNextLevel} className="h-2" />
                        </div>
                        <div className="text-muted-foreground flex justify-center gap-6 text-sm md:justify-start">
                            <span>
                                <strong className="text-foreground">{userXP.weeklyXP.toLocaleString()}</strong> XP this week
                            </span>
                            <span>
                                <strong className="text-foreground">{userXP.monthlyXP.toLocaleString()}</strong> XP this month
                            </span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

// =============================================
// Top 3 Podium
// =============================================

interface ITopThreePodiumProps {
    entries: ILeaderboardEntry[];
}

const TopThreePodium = ({ entries }: ITopThreePodiumProps) => {
    if (entries.length === 0) return null;

    // Reorder for podium: 2nd, 1st, 3rd
    const podiumOrder = [entries[1], entries[0], entries[2]].filter(Boolean);

    const getPodiumStyles = (rank: number) => {
        switch (rank) {
            case 1:
                return {
                    height: 'h-32',
                    bg: 'bg-gradient-to-t from-yellow-500/20 to-yellow-500/5',
                    border: 'border-yellow-500/30',
                    crown: 'text-yellow-500',
                    avatar: 'ring-4 ring-yellow-500/50',
                };
            case 2:
                return {
                    height: 'h-24',
                    bg: 'bg-gradient-to-t from-gray-400/20 to-gray-400/5',
                    border: 'border-gray-400/30',
                    crown: 'text-gray-400',
                    avatar: 'ring-4 ring-gray-400/50',
                };
            case 3:
                return {
                    height: 'h-20',
                    bg: 'bg-gradient-to-t from-amber-600/20 to-amber-600/5',
                    border: 'border-amber-600/30',
                    crown: 'text-amber-600',
                    avatar: 'ring-4 ring-amber-600/50',
                };
            default:
                return {
                    height: 'h-16',
                    bg: 'bg-muted/50',
                    border: 'border-border',
                    crown: 'text-muted-foreground',
                    avatar: '',
                };
        }
    };

    return (
        <div className="flex items-end justify-center gap-4 pt-8">
            {podiumOrder.map((entry) => {
                if (!entry) return null;
                const styles = getPodiumStyles(entry.rank);

                return (
                    <div key={entry.userId} className="flex flex-col items-center">
                        {/* Avatar & Crown */}
                        <div className="relative mb-2">
                            {entry.rank === 1 && (
                                <Crown className="absolute -top-6 left-1/2 h-8 w-8 -translate-x-1/2 text-yellow-500" />
                            )}
                            <Avatar className={cn('h-16 w-16', styles.avatar)}>
                                <AvatarImage src={entry.avatarLink ?? undefined} alt={entry.fullName} />
                                <AvatarFallback className="text-lg">
                                    {entry.fullName.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                        </div>

                        {/* Name & XP */}
                        <p className={cn(
                            'mb-1 max-w-[100px] truncate text-center font-semibold',
                            entry.isCurrentUser && 'text-primary',
                        )}>
                            {entry.fullName}
                        </p>
                        <div className="mb-2 flex items-center gap-1">
                            <Zap className="h-4 w-4 text-yellow-500" />
                            <span className="font-medium">{entry.xp.toLocaleString()}</span>
                        </div>

                        {/* Podium */}
                        <div className={cn(
                            'flex w-24 items-center justify-center rounded-t-lg border-t border-x',
                            styles.height,
                            styles.bg,
                            styles.border,
                        )}>
                            <span className={cn('text-3xl font-bold', styles.crown)}>
                                {entry.rank}
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

// =============================================
// Leaderboard Row
// =============================================

interface ILeaderboardRowProps {
    entry: ILeaderboardEntry;
    isCurrentUser: boolean;
}

const LeaderboardRow = ({ entry, isCurrentUser }: ILeaderboardRowProps) => {
    return (
        <div className={cn(
            'flex items-center gap-4 rounded-lg border p-4 transition-colors',
            isCurrentUser ? 'border-primary/30 bg-primary/5' : 'hover:bg-muted/50',
        )}>
            {/* Rank */}
            <div className="flex w-12 justify-center">
                {entry.rank <= 10 ? (
                    <Badge variant={isCurrentUser ? 'default' : 'secondary'} className="w-8 justify-center">
                        {entry.rank}
                    </Badge>
                ) : (
                    <span className="text-muted-foreground">{entry.rank}</span>
                )}
            </div>

            {/* Avatar */}
            <Avatar className="h-10 w-10">
                <AvatarImage src={entry.avatarLink ?? undefined} alt={entry.fullName} />
                <AvatarFallback>
                    {entry.fullName.charAt(0).toUpperCase()}
                </AvatarFallback>
            </Avatar>

            {/* Name & Level */}
            <div className="flex-1">
                <p className={cn('font-medium', isCurrentUser && 'text-primary')}>
                    {entry.fullName}
                    {isCurrentUser && <span className="text-muted-foreground ml-2 text-sm">(You)</span>}
                </p>
                <p className="text-muted-foreground text-sm">Level {entry.level}</p>
            </div>

            {/* XP */}
            <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-500" />
                <span className="font-semibold">{entry.xp.toLocaleString()}</span>
                <span className="text-muted-foreground text-sm">XP</span>
            </div>
        </div>
    );
};

// =============================================
// Loading Skeleton
// =============================================

const LeaderboardSkeleton = () => {
    return (
        <div className="space-y-4">
            {/* Podium Skeleton */}
            <div className="flex items-end justify-center gap-4 pt-8">
                {[24, 32, 20].map((height, i) => (
                    <div key={i} className="flex flex-col items-center">
                        <Skeleton className="mb-2 h-16 w-16 rounded-full" />
                        <Skeleton className="mb-1 h-4 w-20" />
                        <Skeleton className="mb-2 h-4 w-16" />
                        <Skeleton className={`h-${height} w-24 rounded-t-lg`} />
                    </div>
                ))}
            </div>

            {/* Rows Skeleton */}
            <div className="mt-8 space-y-2">
                {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 rounded-lg border p-4">
                        <Skeleton className="h-6 w-8" />
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-20" />
                        </div>
                        <Skeleton className="h-4 w-24" />
                    </div>
                ))}
            </div>
        </div>
    );
};

// =============================================
// Empty State
// =============================================

const EmptyLeaderboard = () => {
    return (
        <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
                <Trophy className="text-muted-foreground mb-4 h-16 w-16" />
                <h3 className="mb-2 text-xl font-semibold">No Rankings Yet</h3>
                <p className="text-muted-foreground text-center">
                    Be the first to earn XP and claim the top spot!
                </p>
            </CardContent>
        </Card>
    );
};
